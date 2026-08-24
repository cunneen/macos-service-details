import * as log from "@tauri-apps/plugin-log";
import { Command } from "@tauri-apps/plugin-shell";
import { useCallback, useState } from "preact/hooks";
import "./App.css";
import { BtmToJsonConverter, setLogger } from "./util/BtmToJsonConverter";

// set the logger on the BtmToJsonConverter
setLogger(log);
// show log messages in the webview console
log.attachConsole();

function App() {
  const [_dumpBtmRaw, setDumpBtmRaw] = useState("");
  const [_dumpBtmParsed, setDumpBtmParsed] = useState<object | undefined>();
  const [state, setState] = useState("Run Commands");

  const dumpBtm = useCallback(async (_e: MouseEvent) => {
    setState("loading");
    const result = await Command.create("dumpbtm", [
      "sfltool",
      "dumpbtm",
    ]).execute();
    // const result = await Command.create("sudo", [
    //   "whoami",
    // ]).execute();

    setState("verifying");

    if (result?.stdout?.length > 0) {
      setDumpBtmRaw(result.stdout);
      const converter = BtmToJsonConverter();
      const json = converter.toJson(result.stdout);
      setDumpBtmParsed(json);
      setState("Success!");
    } else {
      setState("Error!");
    }
  }, []);

  return (
    <main class="container">
      <h1>{state}</h1>

      <button onClick={dumpBtm} type="button">
        sfltool dumpbtm
      </button>
      {/* ===== uncomment to show env variables ===== */}
      {/* {Object.entries(import.meta.env).map(
        ([key, value]: [key: string, value: string | number | boolean]) => (
          <li>
            {key}: {`${String(value)}`}
          </li>
        ),
      )} */}
    </main>
  );
}

export default App;
