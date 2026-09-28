import React from "react";
import { createBrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
import { AppErrorBoundary, AppErrorFallback } from "./index";
import { clearLocalDataBeforeStartup, isLocalDataResetRequested } from "./clear-local-data";
import { getRecoveryMessages } from "../i18n/resources";

export async function startApplication(): Promise<void> {
  let resetting = false;
  try {
    resetting = isLocalDataResetRequested();
    if (resetting) await clearLocalDataBeforeStartup();
    resetting = false;
    // No Firebase or persisted application state may initialize until the requested reset completes.
    await import("@/shared/firebase");
    const [{ default: App }, { appRoutes }] = await Promise.all([import("../App"), import("../routes")]);
    const router = createBrowserRouter(appRoutes);
    const root = document.getElementById("root");
    if (root === null) throw new Error("Missing root element");
    createRoot(root).render(
      <React.StrictMode>
        <AppErrorBoundary>
          <App router={router} />
        </AppErrorBoundary>
      </React.StrictMode>
    );
  } catch (error) {
    const root = document.getElementById("root");
    if (root === null) throw error;
    createRoot(root).render(
      <AppErrorFallback
        error={error}
        allowLocalDataReset={resetting}
        description={resetting ? getRecoveryMessages("en").clearFailed : ""}
      />
    );
  }
}
