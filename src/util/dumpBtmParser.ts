import * as chevrotain from "chevrotain";
// import { Logger, type TLogLevel } from "tslog";

// const logLevel = process.env.TSLOG_LEVEL || process.env.LOG_LEVEL || "INFO";
// const log = new Logger({ name: "dumpBtmProcessor", minLevel: logLevel as TLogLevel });


export const BtmParser = () => {
  // ----------------- Lexer -----------------
  const createToken = chevrotain.createToken;
  const Lexer = chevrotain.Lexer;

  const patterns = {
    RECORDS_HEADER_LINE: /========================\n/,
    RECORDS_HEADER: / Records for UID ([0-9-]+) : ([0-9A-F-]+)\n/,
    RECORD_STATE_LINE:
      / (ServiceManagement migrated|LaunchServices registered): (true|false)\n/,
    ITEMS: / Items:\n/,
    ITEM_NUMBER: / #\d+:\n/,
    ITEM_KEY_VALUE: / {4}[A-Za-z. ]{3,}: .*\n/,
    EMBEDDED_ITEM_IDENTIFIERS: / {2}Embedded Item Identifiers:\n/,
    EMBEDDED_ITEM_NUMBER: / {4}#\d+: .+\n/,
    BLANK_LINE: /[ \t]*\n/,
  };

  const TOK: { [key: string]: chevrotain.TokenType } = {};

  for (const [patName, pat] of Object.entries(patterns)) {
    //TODO: currently this only understands individual patterns. Need to add: group (e.g. Lexer.SKIPPED)
    if (pat instanceof RegExp) {
      TOK[patName] = createToken({
        name: patName,
        pattern: pat,
      });
      TOK[patName].LABEL = pat.toString();
    }
  }

  //  const WhiteSpace = createToken({
  //    name: "WhiteSpace",
  //    pattern: /\s+/,
  //    group: Lexer.SKIPPED,
  //  });

  const btmFileTokens = [
    //    WhiteSpace,
    ...Object.values(TOK),
  ];

  const BtmLexer = new Lexer(btmFileTokens, { ensureOptimizations: true });

  const lex = (inputText: string) => {
    const lexingResult = BtmLexer.tokenize(inputText);

    if (lexingResult.errors.length > 0) {
      throw Error("Sad Sad Panda, lexing errors detected");
    }

    return lexingResult;
  };

  // ----------------- parser -----------------
  const EmbeddedActionsParser = chevrotain.EmbeddedActionsParser;

  class BtmFileParser extends EmbeddedActionsParser {

    startRule: chevrotain.ParserMethod<[], { [key: string]: unknown; }[]>;

    constructor() {
      super(btmFileTokens, { recoveryEnabled: true });

      type PatternName = keyof typeof patterns;
      type BtmParserType = BtmFileParser & {
        [patName in Lowercase<PatternName>]: any;
      } & {
        [key in
          | "records_state_group"
          | "record_group"
          | "items_group"
          | "records_heading_group"
          | "items_heading_group"
          | "record_state_line"
          | "blank_line"
          | "item"]: any;
      } 
      const $ = this as BtmParserType;

      for (const [patName, pat] of Object.entries(patterns)) {
        //TODO: currently this only understands individual patterns. Need to add: group (e.g. Lexer.SKIPPED)
        if (pat instanceof RegExp) {
          //TOK[patName] = createToken({ name: patName, pattern: pat });
          //TOK[patName].LABEL = patName
          $.RULE(`${patName}`.toLowerCase(), () => {
            const lit = $.CONSUME(TOK[patName]);
            if (/:/.test(lit.image)) {
              const [key, ...vals] = lit.image.split(":");
              return [key.trim(), vals.join(":").trim()];
            } else {
              return [patName, lit.image];
            }
          });
        }
      }
      $.RULE("records_state_group", () => {
        const stateLines = [];
        stateLines.push($.SUBRULE1($.record_state_line));
        $.MANY(() => stateLines.push($.SUBRULE2($.record_state_line)));
        $.SUBRULE($.blank_line);
        return Object.fromEntries(stateLines);
      });

      $.RULE("records_heading_group", () => {
        $.SUBRULE1($.records_header_line);
        const header = $.SUBRULE($.records_header);
        $.SUBRULE2($.records_header_line);
        $.SUBRULE1($.blank_line);
        return Object.fromEntries([header as [string, string]]);
      });
      $.RULE("item", () => {
        $.SUBRULE($.item_number);
        const items = [] as [string, string][];
        $.MANY1(() => items.push($.SUBRULE($.item_key_value)));
        $.OPTION(() => {
          $.SUBRULE($.embedded_item_identifiers);
          $.MANY2(() => $.SUBRULE($.embedded_item_number));
        });
        $.SUBRULE($.blank_line);
        return Object.fromEntries(items);
      });
      $.RULE("items_group", () => {
        $.SUBRULE($.items);
        $.SUBRULE1($.blank_line);
        const itemGroup = [];
        itemGroup.push($.SUBRULE1($.item));
        $.MANY(() => itemGroup.push($.SUBRULE2($.item)));
        return itemGroup;
      });
      $.RULE("record_group", () => {
        const recGroup = {} as {
          UID?: string;
          GUID?: string;
          state?: unknown;
          items?: unknown;
        };
        const headingLine = this.SUBRULE($.records_heading_group) as [
          string,
          string,
        ];
        recGroup.UID = String(headingLine[0]).split("UID ")[1];
        recGroup.GUID = headingLine[1];
        recGroup.state = $.SUBRULE($.records_state_group);
        recGroup.items = $.SUBRULE($.items_group);
        this.SUBRULE($.blank_line);
        return recGroup;
      });
      this.startRule = $.RULE("btmFile", () => {
        const btmFile = [] as { [key: string]: unknown }[];
        $.MANY1(() => {
          btmFile.push($.SUBRULE($.record_group));
        });
        $.MANY2(() => {
          $.SUBRULE($.blank_line);
        });
        return btmFile;
      });

      // very important to call this after all the rules have been setup.
      // otherwise the parser may not work correctly as it will lack information
      // derived from the self analysis.
      this.performSelfAnalysis();
    }
  }

  // We only ever need one as the parser internal state is reset for each new input.
  const parserInstance = new BtmFileParser();

  const toJson = (inputText: string) => {
    const lexResult = lex(inputText);

    // ".input" is a setter which will reset the parser's internal's state.
    parserInstance.input = lexResult.tokens;

    // No semantic actions so this won't return anything yet.
    const json = parserInstance.startRule();

    if (parserInstance.errors.length > 0) {
      throw Error(
        "Sad sad panda, parsing errors detected!\n" +
          parserInstance.errors[0].message,
      );
    }

    return json;
  };

  // for the playground to work the returned object must contain these fields
  return {
    lexer: BtmLexer,
    parser: BtmFileParser,
    toJson: toJson,
    defaultRule: "btmFile",
  };
};
