import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import { clearLocalDataBeforeStartup, isLocalDataResetRequested } from "./clear-local-data";

export const ApplicationStartup = lazy(async () => {
  if (isLocalDataResetRequested()) await clearLocalDataBeforeStartup();

  // No Firebase or persisted application state may initialize until the requested reset completes.
  await import("@/shared/firebase");
  const [{ default: App }, { appRoutes }] = await Promise.all([import("../App"), import("../routes")]);
  const router = createBrowserRouter(appRoutes);

  return {
    default: function Application() {
      return <App router={router} />;
    },
  };
});
