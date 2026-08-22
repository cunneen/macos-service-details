import fs from "node:fs/promises";
import path from "node:path";
import { Logger, type TLogLevel } from "tslog";
import { expect, test } from "vitest";
import { BtmParser } from "../src/util/dumpBtmParser";

const logLevel = process.env.TSLOG_LEVEL || process.env.LOG_LEVEL || "INFO";
const log = new Logger({ name: "TEST: BtmParser", minLevel: logLevel as TLogLevel });

test.beforeAll(async () => {
  const stat = await fs.stat(path.join(__dirname, "assets", "dumpbtm.txt"));
  expect(stat.isFile(), "dumpbtm.txt is not a file. Run 'npm run dumpbtm' to create it.").toBe(true);
  if (!stat.isFIFO()) {
    test.skip("dumpbtm.txt is not a file. Run 'npm run dumpbtm' to create it.");
  }
});

test("BtmParser", async () => {
  try {
    const inputBtmFileContents = await fs.readFile(
      path.join(__dirname, "assets", "dumpbtm.txt"),
      "utf8",
    );

    const btm = BtmParser();

    const json = btm.toJson(inputBtmFileContents);
    // await fs.writeFile(
    //   path.join(__dirname, "assets", "dumpbtm.json"),
    //   JSON.stringify(json, null, 2),
    //   "utf-8",
    // );

    expect(json).toHaveProperty("length");
    expect(json.length).toBeGreaterThan
    expect(json?.[0]).toHaveProperty("state");
    expect(json?.[0]).toHaveProperty("items");
    const firstItemSet = json?.[0].items as { [key: string]: string }[];
    expect(firstItemSet.length ?? 0).toBeGreaterThan(0);
  } catch (error) {
    log.error("BtmParser failed");
    if (error instanceof Error) {
      log.error(error);
    }
    throw error;
  }

});
