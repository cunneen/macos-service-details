import { Button } from "@heroui/react";
import { Command } from "@tauri-apps/plugin-shell";
import { useCallback, useState } from "react";
import "./App.css";
import { DataTable } from "./DataTable";
import { mapBtmItems } from "./mapBtmItems";
import { BtmToJsonConverter, setLogger } from "./util/BtmToJsonConverter";
import { flattenDeep } from "./util/flattenDeep";
import { getLoggerForCurrentRuntime } from "./util/getLoggerForCurrentRuntime";
import { isTauriRuntime } from "./util/isTauriRuntime";

const log = getLoggerForCurrentRuntime();
// set the logger on the BtmToJsonConverter
setLogger(log);

const isTauri = isTauriRuntime();

// ===== main application
function App() {
  const [flattenedData, setFlattenedData] = useState<{ [k: string]: string }[]>(
    [],
  );
  const [state, _setState] = useState("Run Commands");

  const dumpBtm = useCallback(async () => {
    // get BTM data from `sfltool`
    const result = await Command.create("dumpbtm", [
      "sfltool",
      "dumpbtm",
    ]).execute();

    if (result?.stdout?.length > 0) {
      // parse the BTM output into JSON
      const converter = BtmToJsonConverter();
      type JSONArray = {
        Username?: string;
        GUID: string;
        UID: string;
        state: { [key: string]: unknown };
        [key: string]: unknown;
      }[];

      let json: JSONArray = converter.toJson(result.stdout) as JSONArray;

      // get the user names via `dscl . -list /Users GeneratedUID`
      if (json.length > 0) {
        const userGUIDsResult = await Command.create("getUserGUIDs", [
          "sh",
          "-c",
          "dscl . -list /Users GeneratedUID | sort -k 1 -n",
          "dumpbtm",
        ]).execute();
        const userGUIDsMap = Object.fromEntries(
          userGUIDsResult.stdout
            .split("\n")
            .map((i) => i.trim())
            .map((i) => i.split(/\s+/))
            .map(([k, v]) => [v, k]),
        );

        // update our BTM JSON with the user names
        const updatedEntries: JSONArray = [];
        for (const jsonEntry of json) {
          jsonEntry.Username = userGUIDsMap[jsonEntry.GUID];
          log.debug(
            `jsonEntry.Username=${jsonEntry.Username} for guid ${jsonEntry.state.GUID}`,
          );
          updatedEntries.push(jsonEntry);
        }
        json = updatedEntries;
      } else {
        log.warn("No output from sfltool dumpbtm");
      }
      const flattened = flattenDeep(mapBtmItems(json));
      setFlattenedData(flattened);
    } else {
      log.warn("Failed to run sfltool dumpbtm");
    }
  }, []);

  return (
    <main className={"flex flex-col items-start content-center min-w-full"}>
      <div
        className={
          "flex items-center content-center flex-col flex-1 py-10 ph-2 w-screen"
        }
      >
        <h1 className={"text-2xl flex-1"}>{state}</h1>
        <div className={"flex flex-row"}>
          <Button isDisabled={!isTauri} onClick={dumpBtm} className={"m-4"}>
            sfltool dumpbtm
          </Button>
        </div>
      </div>
      <div
        className={
          "flex items-start content-start flex-col flex-1"
        }
      >
        <DataTable
          // biome-ignore lint/suspicious/noExplicitAny: we want SFLTable to be widely applicable to different data types if possible
          data={flattenedData as any[]}
          options={{
            layoutOptions: {
              headingHeight: 56,
              rowHeight: 56,
            },
            ariaLabel: "SharedFileList data",
          }}
        />
      </div>
    </main>
  );
}

export default App;
