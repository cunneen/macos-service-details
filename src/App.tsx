import { Button } from "@heroui/react";
import { Command } from "@tauri-apps/plugin-shell";
import { useCallback, useState } from "react";
import "./App.css";
import { SFLTable } from "./SFLTable";
import { BtmToJsonConverter, setLogger } from "./util/BtmToJsonConverter";
import { getLoggerForCurrentRuntime } from "./util/getLoggerForCurrentRuntime";
import { isTauriRuntime } from "./util/isTauriRuntime";

const log = getLoggerForCurrentRuntime();
// set the logger on the BtmToJsonConverter
setLogger(log);

const isTauri = isTauriRuntime();

function App() {
  const [_dumpBtmRaw, setDumpBtmRaw] = useState("");
  const [_dumpBtmParsed, setDumpBtmParsed] = useState<object | undefined>();
  const [state, setState] = useState("Run Commands");

  const dumpBtm = useCallback(async () => {
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
    <main className={"flex items-center content-center flex-col flex-1 w-full p-10 max-w-5/6"}>
      <h1 className={"text-2xl flex-1"}>{state}</h1>

      <Button isDisabled={!isTauri} onClick={dumpBtm} className={"my-4"}>
        sfltool dumpbtm
      </Button>
      {/* ===== uncomment to show env variables ===== */}
      {/* {Object.entries(import.meta.env).map(
        ([key, value]: [key: string, value: string | number | boolean]) => (
          <li>
            {key}: {`${String(value)}`}
          </li>
        ),
      )} */}
      {state === "Success!" && (
        <SFLTable data={_dumpBtmParsed as any[]} />
      )}
    </main>
  );
}

export default App;
