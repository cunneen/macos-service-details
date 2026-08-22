import path from "node:path";
import { Logger, type TLogLevel } from "tslog";
import { test } from "vitest";
import {
  type DumpBtmProcessorParams,
  dumpBtmProcessor,
} from "../src/util/dumpbtmProcessor";

const logLevel = process.env.TSLOG_LEVEL || process.env.LOG_LEVEL || "INFO";
const log = new Logger({ name: "TEST: dumpBtmProcessor", minLevel: logLevel as TLogLevel });

test("dumpBtmProcessor", async () => {
  try {
    const params: DumpBtmProcessorParams = {
      inputBtmFilePath: path.join(__dirname, "assets", "dumpbtm.txt")
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
