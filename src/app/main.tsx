import "./styles/index.css";
import { showStartupFailure } from "./recovery/fallback";
import { resetApplicationIfRequested } from "./recovery/reset";

async function startApplication(): Promise<void> {
  if (await resetApplicationIfRequested()) return;
  // Module initialization failures happen before a React Error Boundary can catch them.
  await import("./bootstrap");
}

void startApplication().catch(showStartupFailure);
