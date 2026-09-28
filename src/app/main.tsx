import "./styles/index.css";
import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { AppErrorBoundary } from "./error-boundary";
import { ApplicationStartup } from "./error-boundary/ApplicationStartup";
import { StartupFallback } from "./error-boundary/StartupFallback";

const root = document.getElementById("root");
if (root === null) throw new Error("Missing root element");

createRoot(root).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <Suspense fallback={<StartupFallback />}>
        <ApplicationStartup />
      </Suspense>
    </AppErrorBoundary>
  </React.StrictMode>
);
