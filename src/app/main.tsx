import "./styles/index.css";
import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { AppErrorBoundary } from "./error-boundary";
import { ApplicationStartup } from "./error-boundary/ApplicationStartup";

const root = document.getElementById("root");
if (root === null) throw new Error("Missing root element");

createRoot(root).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <Suspense fallback={null}>
        <ApplicationStartup />
      </Suspense>
    </AppErrorBoundary>
  </React.StrictMode>
);
