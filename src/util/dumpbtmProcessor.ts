import fs from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { Logger } from "tslog";

const log = Logger.fromEnv({ name: "dumpBtmProcessor"});

// this is just an enum, but "erasableSyntaxOnly" doesn't let us use enums.
export type BtmOutputTypePath = "path";
export type BtmOutputTypeStream = "stream";

export type DumpBtmOutputFilePathOption = {
  /**
   * The full path to the file to which output should be appended
   */
  outputFilePath: string;
  outputType: BtmOutputTypePath;
};
export type DumpBtmOutputWriteStreamOption = {
  outputWriteStream: fs.WriteStream;
  outputType: BtmOutputTypeStream;
};
export type DumpBtmProcessorParams = {
  inputBtmFilePath: string;
} & Partial<DumpBtmOutputFilePathOption | DumpBtmOutputWriteStreamOption>;

export const dumpBtmProcessor = async (params: DumpBtmProcessorParams) => {

  // read params
  const { inputBtmFilePath, ...outputOptions } = params;
  log.debug(`    params: ${JSON.stringify(params)}`);
  log.debug(`    outputOptions: ${JSON.stringify(outputOptions)}`);
  let outputFilePath: string | undefined;
  let outputWriteStream: fs.WriteStream | undefined;
  if (outputOptions && Object.keys(outputOptions).length > 0) {
    if (outputOptions.outputType === "path") {
      if (outputOptions.outputFilePath) {
        outputFilePath = outputOptions.outputFilePath;
      } else {
        throw new Error("outputFilePath is required");
      }
      // outputFilePath is truthy now
    } else if (outputOptions.outputType === "stream") {
      if (outputOptions.outputWriteStream) {
        outputWriteStream = outputOptions.outputWriteStream;
      } else {
        throw new Error("outputWriteStream is required");
      }
      // outputFilePath is possibly undefined but outputWriteStream is now truthy
    } else {
      log.debug(`outputOptions: ${JSON.stringify(outputOptions)}`);
      throw new Error("outputType is required");
    }
  } else {
    // no output path or stream specified, so we'll use a temporary file
    const dateString = new Date()
      .toISOString()
      .replaceAll(":", "")
      .replace("T", "_")
      .substring(0, 17); // YYYY-MM-DD_HHMMSS
    outputFilePath = path.join(tmpdir(), `btm-processed-${dateString}.txt`);
    log.debug(`outputFilePath: ${outputFilePath}`);
    // outputFilePath is truthy now
  }

  // check params
  if (!inputBtmFilePath) {
    throw new Error("inputBtmFilePath is required");
  }

  const fileReadStream = await fs.createReadStream(
    params.inputBtmFilePath,
    "utf-8",
  );

  // in all cases above we have an outputFilePath OR an outputWriteStream defined.
  if (!outputWriteStream && outputFilePath) {
    outputWriteStream = fs.createWriteStream(outputFilePath, "utf-8");
    // log.debug("outputWriteStream: ", outputWriteStream);
  }

  // this never triggers, but typescript can't figure that out.
  if (!outputWriteStream) {
    log.debug("outputWriteStream: FALSY: ", outputWriteStream);
    throw new Error("No output stream or file path was provided");
  }

  const patterns = {
    RECORDS_HEADER_LINE: /^========================$/,
    RECORDS_HEADER: /Records for UID/,
    RECORD_STATE_LINE:
      /^ (ServiceManagement migrated|LaunchServices registered)/,
    ITEMS_TOKEN: /^ Items:$/,
    ITEM_NUMBER: / #\d+:/,
    ITEM_KEY_VALUE: / {4}[A-Za-z. ]{3,}: .*$/,
    EMBEDDED_ITEM_IDENTIFIERS: /^ {2}Embedded Item Identifiers:/,
    EMBEDDED_ITEM_NUMBER: /^ {4}#\d+: .+$/,
    BLANK_LINE: /^\s*$/,
  };

  type StateName = string;

  type START_OF_FILE_PATTERN = null;
  type END_OF_FILE_PATTERN = null;

  type State = {
    pattern: RegExp | START_OF_FILE_PATTERN | END_OF_FILE_PATTERN;
    transitions: StateName[];
  };

  type StateMachine = {
    [key: StateName]: State;
  };

  /* The input file is formatted like this:
  ========================                                     
   Records for UID -2 : FFFFEEEE-DDDD-CCCC-BBBB-AAAAFFFFFFFE   
  ========================                                     
                                                               
   ServiceManagement migrated: true                            
   LaunchServices registered: false                            
                                                               
   Items:                                                      
                                                               
   #1:                                                         
                   UUID: 928B54C9-1DF0-4890-9961-5F1CA140D05C  
                   Name: (null)                                
                    ...: ...                                   
    Embedded Item Identifiers:                                 
      #1: com.apple.amsdstat                                   
                                                               
   #2:                                                         
                   UUID: 4DB62B24-FAE3-4286-8448-ADA0926AEE07  
  ... */
  const states: StateMachine = {
    BEGIN: {
      pattern: null,
      transitions: ["END", "RECORDS_HEADER_STARTED"],
    } /* ========================                                    */,
    RECORDS_HEADER_STARTED: {
      pattern: patterns.RECORDS_HEADER_LINE,
      transitions: ["RECORDS_HEADER"],
    } /*  Records for UID -2 : FFFFEEEE-DDDD-CCCC-BBBB-AAAAFFFFFFFE  */,
    RECORDS_HEADER: {
      pattern: patterns.RECORDS_HEADER,
      transitions: ["RECORDS_HEADER_END"],
    } /* ========================                                    */,
    RECORDS_HEADER_END: {
      pattern: patterns.RECORDS_HEADER_LINE,
      transitions: ["RECORDS_HEADER_END_BLANK_LINE"],
    } /*                                                             */,
    RECORDS_HEADER_END_BLANK_LINE: {
      pattern: patterns.BLANK_LINE,
      transitions: ["RECORD_STATE_LINE"],
    } /*  ServiceManagement migrated: true                           */,
    RECORD_STATE_LINE: {
      pattern: patterns.RECORD_STATE_LINE,
      transitions: ["RECORD_STATE_LINE", "RECORD_STATE_BLANK_LINE"],
    } /*  LaunchServices registered: false                           */,
    RECORD_STATE_BLANK_LINE: {
      pattern: patterns.BLANK_LINE,
      transitions: ["ITEMS_TOKEN"],
    } /*                                                             */,
    ITEMS_TOKEN: {
      pattern: patterns.ITEMS_TOKEN,
      transitions: ["ITEMS_TOKEN_BLANK_LINE"],
    } /*  Items:                                                     */,
    ITEMS_TOKEN_BLANK_LINE: {
      pattern: patterns.BLANK_LINE,
      transitions: ["ITEM_NUMBER"],
    } /*                                                             */,
    ITEM_NUMBER: {
      pattern: patterns.ITEM_NUMBER,
      transitions: ["ITEM_KEY_VALUE"],
    } /*  #1:                                                        */,
    ITEM_KEY_VALUE: {
      pattern: patterns.ITEM_KEY_VALUE,
      transitions: [
        "ITEM_KEY_VALUE",
        "EMBEDDED_ITEM_IDENTIFIERS",
        "ITEM_END_BLANK_LINE",
      ],
    } /*                  UUID: 928B54C9-1DF0-4890-9961-5F1CA140D05C */,
    /*                  Name: (null)                               */
    /*                   ...: ...                                  */
    EMBEDDED_ITEM_IDENTIFIERS: {
      pattern: patterns.EMBEDDED_ITEM_IDENTIFIERS,
      transitions: ["EMBEDDED_ITEM_NUMBER"],
    } /*   Embedded Item Identifiers:                                */,
    EMBEDDED_ITEM_NUMBER: {
      pattern: patterns.EMBEDDED_ITEM_NUMBER,
      transitions: ["EMBEDDED_ITEM_NUMBER", "EMBEDDED_ITEM_END_BLANK_LINE"],
    } /*     #1: com.apple.amsdstat                                  */,
    EMBEDDED_ITEM_END_BLANK_LINE: {
      pattern: patterns.BLANK_LINE,
      transitions: ["ITEM_NUMBER", "RECORDS_HEADER_STARTED", "END"],
    } /*                                                             */,
    ITEM_END_BLANK_LINE: {
      pattern: patterns.BLANK_LINE,
      transitions: [
        "ITEM_END_BLANK_LINE",
        "ITEM_NUMBER",
        "RECORDS_HEADER_STARTED",
        "END",
      ],
    } /*  #2:                                                        */,
    END: {
      pattern: null,
      transitions: [],
    } /*                  UUID: 4DB62B24-FAE3-4286-8448-ADA0926AEE07 */,
  };

  let currentState: State = states.BEGIN;

  const processLine = (line: string) => {
    // look through the expected states to see which ones match the new line we've just read
    for (const expectedStateName of currentState.transitions) {
      const expectedStateDefinition = states[expectedStateName];
      if (expectedStateDefinition.pattern instanceof RegExp) {
        if (expectedStateDefinition.pattern.test(line)) {
          // we've received a line that matches the expected state.
          outputWriteStream.write(
            `${expectedStateName.padEnd(30, " ")}: ${line}\n`,
          );
          currentState = states[expectedStateName];
          return;
        }
      } else if (expectedStateDefinition.pattern === null) {
        // we've received a line, so it's not the end of the file.
        //   But there might be other expected states that match this line.
      }
    }
    // we don't know what to do with this line. This is an error.

    log.debug(`Unexpected line: ${line}`);
    log.debug("Current state:", currentState);
    log.debug("Expected states:", currentState.transitions);
    throw new Error(`Unexpected line: ${line}`);
  };

  const rl = createInterface({ input: fileReadStream, output: process.stdout });
  rl.on("line", (line) => {
    processLine(line);
  });

  rl.on("close", () => {
    outputWriteStream.close();
    // check whether we were expecting the end of the file.
    if (currentState.transitions.includes("END")) {
      log.info("Done");
      log.info("========================================================");
      log.info(`Output written to ${outputFilePath}`);
    } else {
      throw new Error(
        `Unexpected end of file. Expected: ${currentState.transitions.join(", ")}`,
      );
    }
  });
};
