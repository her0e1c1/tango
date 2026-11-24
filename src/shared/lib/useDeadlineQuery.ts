import { useState, useSyncExternalStore } from "react";
import * as lodash from "lodash";

function createDeadlineClock<Inputs extends unknown[]>(inputs: [...Inputs]) {
  let now = Date.now();
  return {
    inputs,
    getSnapshot: () => now,
    subscribe: (notify: () => void, getNextDeadline: (timestamp: number) => number | undefined) => {
      let timer: number | undefined;
      const schedule = () => {
        window.clearTimeout(timer);
        const nextAt = getNextDeadline(now);
        if (nextAt === undefined) return;
        // Distant deadlines must stay below the browser's signed 32-bit timeout limit.
        timer = window.setTimeout(refresh, Math.max(1, Math.min(nextAt - Date.now(), 2 ** 31 - 1)));
      };
      function refresh() {
        now = Date.now();
        schedule();
        notify();
      }
      const onVisible = () => {
        if (document.visibilityState === "visible") refresh();
      };
      schedule();
      window.addEventListener("focus", refresh);
      document.addEventListener("visibilitychange", onVisible);
      return () => {
        window.clearTimeout(timer);
        window.removeEventListener("focus", refresh);
        document.removeEventListener("visibilitychange", onVisible);
      };
    },
  };
}

/** Each mounted consumer owns one clock and wake-up for its next relevant boundary. */
export function useDeadlineQuery<Inputs extends unknown[], T extends { nextDueAt: number | undefined }>(
  evaluate: (...args: [...Inputs, number]) => T,
  inputs: [...Inputs]
): T {
  const [clock, setClock] = useState(() => createDeadlineClock(inputs));
  // Equivalent arrays from a caller are not new data and must not cause render retries.
  if (!lodash.isEqual(inputs, clock.inputs)) {
    // React retries this render before committing children, so input changes never expose an old-clock result.
    setClock(() => createDeadlineClock(inputs));
  }
  const now = useSyncExternalStore(
    (notify) => clock.subscribe(notify, (timestamp) => evaluate(...inputs, timestamp).nextDueAt),
    clock.getSnapshot
  );
  return evaluate(...inputs, now);
}
