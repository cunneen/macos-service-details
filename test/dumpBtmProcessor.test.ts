import path from "node:path";
import { Logger } from "tslog";
import { test, vi } from "vitest";
import {
  type DumpBtmProcessorParams,
  dumpBtmProcessor,
} from "../src/util/dumpbtmProcessor";

const log = new Logger({ name: "TEST: dumpBtmProcessor" });

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
