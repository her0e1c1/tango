import "./styles/index.css";
import React, { lazy, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router-dom";
import { AppErrorBoundary, AppStartupFallback } from "./error-boundary";
import { resetApplicationIfRequested } from "./error-boundary/reset";

// React caches this single startup promise, including across StrictMode renders.
const Application = lazy<() => ReactNode>(async () => {
  if (await resetApplicationIfRequested()) return { default: () => null };

  await import("@/shared/firebase");
  const [{ default: App }, { appRoutes }, { registerSW }] = await Promise.all([
    import("./App"),
    import("./routes"),
    // biome-ignore lint/correctness/noUnresolvedImports: Vite generates this virtual module; it has no filesystem path.
    import("virtual:pwa-register"),
  ]);

  const router = createBrowserRouter(appRoutes);
  registerSW();

  return { default: () => <App router={router} /> };
});

const root = document.getElementById("root");
if (root == null) throw new Error("Missing root element");

createRoot(root).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <React.Suspense fallback={<AppStartupFallback />}>
        <Application />
      </React.Suspense>
    </AppErrorBoundary>
  </React.StrictMode>
);
