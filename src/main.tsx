import { TanStackDevtools } from "@tanstack/preact-devtools";
import { tableDevtoolsPlugin } from "@tanstack/preact-table-devtools";
import { render } from "preact";

import App from "./App";

render(
  <>
    <App />
    <TanStackDevtools plugins={[tableDevtoolsPlugin()]} />
  </>,
  // biome-ignore lint/style/noNonNullAssertion: it's hard coded
  document.getElementById("root")!,
);
