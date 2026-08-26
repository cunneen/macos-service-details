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
  const [userIDs, setUserIDs] = useState("");
  const [userGUIDs, setUserGUIDs] = useState("");
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

  const getUserIDs = useCallback(async () => {
    setState("loading");
    const result = await Command.create("getUserIDs", [
      "sh",
      "-c",
      "dscl . -list /Users UniqueID | sort -k 1 -n", // | join - <(dscl . -list /Users GeneratedUID | sort -k 1 -n )",
      "dumpbtm",
    ]).execute();
    // const result = await Command.create("sudo", [
    //   "whoami",
    // ]).execute();

    setState("verifying");

    if (result?.stdout?.length > 0) {
      setUserIDs(result.stdout);
      setState("Success!");
    } else {
      setState("Error!");
      setUserIDs(result.stderr);
    }
  }, []);

  const getUserGUIDs = useCallback(async () => {
    setState("loading");
    const result = await Command.create("getUserGUIDs", [
      "sh",
      "-c",
      "dscl . -list /Users GeneratedUID | sort -k 1 -n",
      "dumpbtm",
    ]).execute();
    // const result = await Command.create("sudo", [
    //   "whoami",
    // ]).execute();

    setState("verifying");

    if (result?.stdout?.length > 0) {
      setUserGUIDs(result.stdout);
      setState("Success!");
    } else {
      setState("Error!");
      setUserGUIDs(result.stderr);
    }
  }, []);

  return (
    <main
      className={
        "flex items-center content-center flex-col flex-1 w-full p-10 max-w-5/6"
      }
    >
      <h1 className={"text-2xl flex-1"}>{state}</h1>
      <div className={"flex flex-row"}>
        <Button isDisabled={!isTauri} onClick={dumpBtm} className={"m-4"}>
          sfltool dumpbtm
        </Button>
        <Button isDisabled={!isTauri} onClick={getUserIDs} className={"m-4"}>
          get user IDs
        </Button>
        <Button isDisabled={!isTauri} onClick={getUserGUIDs} className={"m-4"}>
          get user GUIDs
        </Button>
      </div>

      <div>User IDs:</div>
      <pre>{userIDs}</pre>
      <div>User GUIDs:</div>
      <pre>{userGUIDs}</pre>
      {/* ===== uncomment to show env variables ===== */}
      {/* {Object.entries(import.meta.env).map(
        ([key, value]: [key: string, value: string | number | boolean]) => (
          <li>
            {key}: {`${String(value)}`}
          </li>
        ),
      )} */}
      {state === "Success!" && <SFLTable data={_dumpBtmParsed as any[]} />}
    </main>
  );
}

export default App;
