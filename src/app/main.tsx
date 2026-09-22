import "./styles/index.css";
import React, { lazy, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { AppErrorBoundary, AppStartupFallback } from "./error-boundary";
import { resetApplicationIfRequested } from "./error-boundary/reset";

// React caches this single startup promise, including across StrictMode renders.
const Application = lazy<() => ReactNode>(async () => {
  if (await resetApplicationIfRequested()) return { default: () => null };
  return import("./bootstrap");
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
