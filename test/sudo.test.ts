import { Logger, type TLogLevel } from "tslog";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type SudoCommandParams, sudoCommand } from "../src/util/sudoCommand";

const logLevel = process.env.TSLOG_LEVEL || process.env.LOG_LEVEL || "INFO";
const log = new Logger({ name: "TEST: sudoCommand", minLevel: logLevel as TLogLevel });


// set process.env.DISABLE_MOCK_SUDO="true" to test the real API (interactively)
vi.mock(import("../src/util/sudoCommand"), async (importOriginal) => {
  const originalModule = await importOriginal();
  return {
    // sudoCommand: vi.fn(originalModule.sudoCommand),
    sudoCommand: vi.fn(
      (
        params: SudoCommandParams,
      ): Promise<string | Buffer<ArrayBufferLike> | undefined> => {
        if (process.env.DISABLE_MOCK_SUDO === "true") {
          log.info(
            `=== invoking original sudoCommand(${JSON.stringify(params)}) ===`,
          );
          return originalModule.sudoCommand(params);
        } else {
          log.info(`=== in mock sudoCommand(${JSON.stringify(params)}) ===`);
          // mock whenever we receive special values for the "name" param ;
          // if it's not one of the expected values then delegate to
          //  the actual implementation.
          switch (params.name) {
            case "resolve":
              return Promise.resolve("root");
            case "reject":
              return Promise.reject(
                new Error("Error: User did not grant permission."),
              );
            case "throw":
              throw new Error("There was an issue");
            case "unexpected":
              return Promise.resolve("foobar");
            default:
              return originalModule.sudoCommand(params);
          }
        }
      },
    ),
  };
});

beforeEach(() => {
  if (process.env.DISABLE_MOCK_SUDO === "true") {
    log.debug(`=== clearing mocks ===`);
    vi.resetAllMocks();
    vi.clearAllMocks();
  } else {
    log.info(`process.env.DISABLE_MOCK_SUDO=${process.env.DISABLE_MOCK_SUDO}`);
  }
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("sudoCommand", async () => {
  it("returns 'root' for 'whoami'", async () => {
    log.debug(`===     ... test 1 ===`);

    const output = await sudoCommand({
      command: "whoami",
      name: "resolve",
      icns: "/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/AlertNoteIcon.icns",
    });

    expect(output).toMatch(/^root/);
    expect(sudoCommand).toHaveBeenCalled();
  });

  it("returns 'root' for 'whoami'", async () => {
    log.debug(`===     ... test 2 ===`);
    let errorThrown = false;
    await sudoCommand({
      command: "whoami",
      name: "reject",
      icns: "/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/AlertNoteIcon.icns",
    })
      .catch((e) => {
        expect(e).toBeInstanceOf(Error);
        expect(e.message).toMatch(/Error: User did not grant permission\./);
        errorThrown = true;
      })
      .finally(() => {
        expect(errorThrown).toBe(true);
        expect(sudoCommand).toHaveBeenCalled();
      });
  });
}, 30000);
