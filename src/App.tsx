// When using the Tauri API npm package:
import { invoke } from "@tauri-apps/api/core";
import { debug, error, info, trace, warn } from "@tauri-apps/plugin-log";
import { useCallback } from "react";
import "./App.css";

// ... so it looks like we can't use sudoCommand (or anything that uses node internals e.g. process, os etc)
// import { sudoCommand } from "./util/sudoCommand";

const log = {
  debug,
  error,
  info,
  trace,
  warn,
};

function App() {
  log.debug(`rendering ${new Date()}`);
  const callRustHandler = useCallback(async () => {
    await invoke("my_custom_command", {params: { foo: "bar" }});
  }, []);
  const logMessageHandler = useCallback(() => {
    log.info("logMessageHandler");
  }, []);
  // // can't use sudoCommand in tauri
  // const sudoCommandHandler = useCallback(async () => {
  //   const sudoResult = await sudoCommand({
  //     command: `echo "hey \${LOGNAME} won't you take me to a funky town?"`,
  //     name: "Auth required",
  //     icns: "/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/AlertNoteIcon.icns",
  //   });
  //   log.info(`sudoEchoHandler: ${sudoResult}`);
  // }, []);
  return (
    <section id="center">
      <div>
        <h1>Get started</h1>
        <p>Push the button</p>
      </div>
      <button
        id="callRust"
        type="button"
        className="counter"
        onClick={callRustHandler}
      >
        Call Rust
      </button>
      <button
        id="logMessage"
        type="button"
        className="counter"
        onClick={logMessageHandler}
      >
        Log Message with Logger
      </button>
      {/* can't use sudoCommand in tauri */}
      {/* <button
        id="sudoCommand"
        type="button"
        className="counter"
        onClick={sudoCommandHandler}
      >
        Won't you take me to...
      </button> */}
    </section>
  );
}

export default App;
