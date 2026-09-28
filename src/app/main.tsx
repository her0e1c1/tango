import "./styles/index.css";
import { createRoot } from "react-dom/client";
import { AppErrorFallback } from "./error-boundary";
import { clearLocalDataBeforeStartup, isLocalDataResetRequested } from "./error-boundary/clear-local-data";
import { getRecoveryMessages } from "./i18n/resources";

async function startApplication(): Promise<void> {
  let resetting = false;
  try {
    resetting = isLocalDataResetRequested();
    if (resetting) await clearLocalDataBeforeStartup();
    resetting = false;
    // No Firebase or persisted application state may initialize until the requested reset completes.
    await import("./render-app");
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

void startApplication();
