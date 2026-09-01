import fs from "node:fs/promises";
import path from "node:path";
import { Logger } from "tslog";
import { describe, expect, it, test } from "vitest";
import { BtmToJsonConverter, setLogger } from "../src/util/sflist/BtmToJsonConverter";

const log = Logger.fromEnv({ name: "TEST: BtmParser" });
setLogger(log);

const INPUT_FILE_PATH = path.join(__dirname, "assets", "dumpbtm.txt");
const INVALID_TOKEN_FILE_PATH = path.join(
  __dirname,
  "assets",
  "dumpbtm_invalid_token.txt",
);
const INVALID_GRAMMAR_FILE_PATH = path.join(
  __dirname,
  "assets",
  "dumpbtm_invalid_grammar.txt",
);

// ensure dumpbtm.txt exists
test.beforeAll(async () => {
  const stat = await fs.stat(INPUT_FILE_PATH).catch((_e) => {
    throw new Error(
      "dumpbtm.txt is not a file. Run 'npm run dumpbtm' to create it.",
    );
  });

  if (!stat.isFile()) {
    test.skip("dumpbtm.txt is not a file. Run 'npm run dumpbtm' to create it.");
  }
});

describe("BtmToJsonConverter", async () => {
  it("should parse dumpbtm.txt", async () => {
    try {
      const inputBtmFileContents = await fs.readFile(
        INPUT_FILE_PATH,
        "utf8",
      );

      const converter = BtmToJsonConverter();

      const json = converter.toJson(inputBtmFileContents);
      await fs.writeFile(
        path.join(__dirname, "assets", "dumpbtm.json"),
        JSON.stringify(json, null, 2),
        "utf-8",
      );

      expect(json).toHaveProperty("length");
      expect(json.length).toBeGreaterThan(0);

      for (const itemGroup of json) {
        expect(
          itemGroup,
          `UID property missing from itemGroup: ${JSON.stringify(itemGroup)}`,
        ).toHaveProperty("UID");
        expect(
          itemGroup,
          `GUID property missing from itemGroup: ${JSON.stringify(itemGroup)}`,
        ).toHaveProperty("GUID");
        expect(
          itemGroup,
          `state property missing from itemGroup: ${JSON.stringify(itemGroup)}`,
        ).toHaveProperty("state");
        expect(
          itemGroup,
          `items property missing from itemGroup: ${JSON.stringify(itemGroup)}`,
        ).toHaveProperty("items");
        const firstItemSet = itemGroup.items as { [key: string]: string }[];
        expect(firstItemSet.length ?? 0).toBeGreaterThan(0);
        for (const item of firstItemSet) {
          expect(
            item,
            `"UUID" property missing from item: ${JSON.stringify(item)}`,
          ).toHaveProperty("UUID");
          expect(
            item,
            `"Name" property missing from item: ${JSON.stringify(item)}`,
          ).toHaveProperty("Name");
          expect(
            item,
            `"Developer Name" property missing from item: ${JSON.stringify(item)}`,
          ).toHaveProperty("Developer Name");
          expect(
            item,
            `"Type" property missing from item: ${JSON.stringify(item)}`,
          ).toHaveProperty("Type");
          expect(
            item,
            `"Flags" property missing from item: ${JSON.stringify(item)}`,
          ).toHaveProperty("Flags");
          expect(
            item,
            `"Disposition" property missing from item: ${JSON.stringify(item)}`,
          ).toHaveProperty("Disposition");
          expect(
            item,
            `"Identifier" property missing from item: ${JSON.stringify(item)}`,
          ).toHaveProperty("Identifier");
          expect(
            item,
            `"URL" property missing from item: ${JSON.stringify(item)}`,
          ).toHaveProperty("URL");
          // expect(item, `"Executable Path" property missing from item: ${JSON.stringify(item)}`).toHaveProperty("Executable Path");
          expect(
            item,
            `"Generation" property missing from item: ${JSON.stringify(item)}`,
          ).toHaveProperty("Generation");
          // expect(item, `"Parent Identifier" property missing from item: ${JSON.stringify(item)}`).toHaveProperty("Parent Identifier");
        }
      }
    } catch (error) {
      log.error("BtmParser failed");
      if (error instanceof Error) {
        log.error(error);
      }
      throw error;
    }
  });

  it("should error on invalid tokens", async () => {
    let errorThrown = false;
    let json: { [key: string]: unknown }[] | undefined;
    const inputBtmFileContents = await fs.readFile(
      INVALID_TOKEN_FILE_PATH,
      "utf8",
    );

    const converter = BtmToJsonConverter();

    try {
      // This should throw an error
      json = converter.toJson(inputBtmFileContents);

      // if we get to this point, fail the test
      expect(json, "json should be undefined").toBeUndefined();
    } catch (error) {
      errorThrown = true;
      log.debug("BtmParser failed, as we expected", error);
    } finally {
      expect(json, "json should be undefined").toBeUndefined();
      expect(errorThrown).toBe(true);
    }
  });

  it("should error on invalid grammar", async () => {
    let errorThrown = false;
    let json: { [key: string]: unknown }[] | undefined;
    const inputBtmFileContents = await fs.readFile(
      INVALID_GRAMMAR_FILE_PATH,
      "utf8",
    );

    const converter = BtmToJsonConverter();

    try {
      // This should throw an error
      json = converter.toJson(inputBtmFileContents);

      // if we get to this point, fail the test
      expect(json, "json should be undefined").toBeUndefined();
    } catch (error) {
      errorThrown = true;
      log.debug("BtmParser failed, as we expected", error);
    } finally {
      expect(json, "json should be undefined").toBeUndefined();
      expect(errorThrown).toBe(true);
    }
  });});
