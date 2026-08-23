import fs from "node:fs/promises";
import path from "node:path";
import { Logger } from "tslog";
import { test } from "vitest";
import {
  type DumpBtmProcessorParams,
  dumpBtmProcessor,
} from "../src/util/dumpbtmProcessor";

const log = Logger.fromEnv({ name: "TEST: dumpBtmProcessor"});

const DUMPBTM_OUTPUT_FILE_PATH = path.join(__dirname, "assets", "dumpbtm.txt");

// ensure dumpbtm.txt exists
test.beforeAll(async () => {
  const stat = await fs
    .stat(DUMPBTM_OUTPUT_FILE_PATH)
    .catch((_e) => {
      throw new Error(
        "dumpbtm.txt is not a file. Run 'npm run dumpbtm' to create it.",
      );
    });

  if (!stat.isFile()) {
    test.skip("dumpbtm.txt is not a file. Run 'npm run dumpbtm' to create it.");
  }
});

test("BtmToJsonConverter", async () => {
  try {
    const params: DumpBtmProcessorParams = {
      inputBtmFilePath: DUMPBTM_OUTPUT_FILE_PATH
    };
    await dumpBtmProcessor(params);
  } catch (error) {
    log.error("dumpBtmProcessor failed");
    if (error instanceof Error) {
      log.error(error);
    }
    throw error;
  }
});
