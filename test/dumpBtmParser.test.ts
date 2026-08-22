import fs from "node:fs/promises";
import path from "node:path";
import { Logger } from "tslog";
import { expect, test, vi } from "vitest";
import { BtmParser } from "../src/util/dumpBtmParser";

const log = new Logger({ name: "TEST: BtmParser" });

test("BtmParser", async () => {
  try {
    const inputBtmFileContents = await fs.readFile(
      path.join(__dirname, "assets", "dumpbtm.txt"),
      "utf8",
    );

    const btm = BtmParser();

    const json = btm.toJson(inputBtmFileContents);
    await fs.writeFile(
      path.join(__dirname, "assets", "dumpbtm.json"),
      JSON.stringify(json, null, 2),
      "utf-8",
    );
    // the output json is like this:

    expect(json).toHaveLength(5);
    expect(json[0]).toHaveProperty("state");
    expect(json[0]).toHaveProperty("items");
    expect(json[0].items).toHaveLength(34);
  } catch (error) {
    log.error("BtmParser failed");
    if (error instanceof Error) {
      log.error(error);
    }
    throw error;
  }
});
