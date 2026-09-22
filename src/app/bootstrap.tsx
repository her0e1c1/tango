import "@/shared/firebase";

import { createBrowserRouter } from "react-router-dom";
// biome-ignore lint/correctness/noUnresolvedImports: Vite generates this virtual module; it has no filesystem path.
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import { appRoutes } from "./routes";

const router = createBrowserRouter(appRoutes);

// This module is loaded once, only after startup has ruled out a reset.
registerSW();

export default function Application() {
  return <App router={router} />;
}
