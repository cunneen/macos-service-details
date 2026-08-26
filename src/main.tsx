import { TanStackDevtools } from "@tanstack/react-devtools";
import { tableDevtoolsPlugin } from "@tanstack/react-table-devtools";
import { createRoot } from "react-dom/client";
import { Providers } from "./Providers";

import App from "./App";

// biome-ignore lint/style/noNonNullAssertion: it's hard coded
createRoot(document.getElementById("root")!).render(
  <Providers>
    <App />
    <TanStackDevtools plugins={[tableDevtoolsPlugin()]} />
  </Providers>
);
