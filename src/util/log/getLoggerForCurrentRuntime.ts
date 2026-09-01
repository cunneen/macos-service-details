import * as logger from "@tauri-apps/plugin-log";
import { isTauriRuntime } from "../tauri/isTauriRuntime";

export const getLoggerForCurrentRuntime = () => {
  // set the logger to tauri if available, otherwise console
  let log: typeof logger | Console = logger;
  // show log messages in the webview console, if we're running in tauri
  if (isTauriRuntime()) {
    (log as typeof logger).attachConsole();
  } else {
    log = console;
  }

  return log;
}