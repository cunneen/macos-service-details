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
  const [userIDs, setUserIDs] = useState<{[k: string]: string}>({});
  const [userGUIDs, setUserGUIDs] = useState<{[k: string]: string}>({});
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
    // setState("Getting User IDs...");
    const userIDsResult = await Command.create("getUserIDs", [
      "sh",
      "-c",
      "dscl . -list /Users UniqueID | sort -k 1 -n", // | join - <(dscl . -list /Users GeneratedUID | sort -k 1 -n )",
      "dumpbtm",
    ]).execute();

    if (userIDsResult?.stdout?.length > 0) {
      // setState("Getting User GUIDs...");
      const userGUIDsResult = await Command.create("getUserGUIDs", [
        "sh",
        "-c",
        "dscl . -list /Users GeneratedUID | sort -k 1 -n",
        "dumpbtm",
      ]).execute();
      // setState("Combining...");

      const userGUIDsMap = Object.fromEntries(
        userGUIDsResult.stdout
          .split("\n")
          .map((i) => i.trim())
          .map((i) => i.split(/\s+/))
          .map(([k,v]) => ([v,k]))
      );

      log.info(`userGUIDs: ${JSON.stringify(userGUIDsMap)}`);

      const userIDsMap = Object.fromEntries(
        userIDsResult.stdout
          .split("\n")
          .map((i) => i.trim())
          .map((i) => i.split(/\s+/))
          .map(([k,v]) => ([v,k]))
          ,
      );

      log.info(`userIDs: ${JSON.stringify(userIDsMap)}`)
      setUserGUIDs(userGUIDsMap);
      setUserIDs(userIDsMap);
      // setState("Success!");
    } else {
      setState("Error!");
    }
  }, []);


  return (
    <main
      className={
        "flex items-center content-center flex-col flex-1 w-full py-10 ph-2 max-w-full"
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

      </div>

      {/* <div>User IDs:</div>
      <pre>{JSON.stringify(userIDs,null,2)}</pre>
      <div>User GUIDs:</div>
      <pre>{JSON.stringify(userGUIDs,null,2)}</pre> */}
      {/* ===== uncomment to show env variables ===== */}
      {/* {Object.entries(import.meta.env).map(
        ([key, value]: [key: string, value: string | number | boolean]) => (
          <li>
            {key}: {`${String(value)}`}
          </li>
        ),
      )} */}
      {/** biome-ignore lint/suspicious/noExplicitAny: we want SFLTable to be widely applicable to different data types if possible */}
      {state === "Success!" && <SFLTable data={_dumpBtmParsed as any[]} userGUIDs={userGUIDs} userIDs={userIDs} />}
    </main>
  );
}

export default App;
