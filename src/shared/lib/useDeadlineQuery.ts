import { useEffect, useState } from "react";
import * as lodash from "lodash";

/** Each mounted consumer owns one clock and wake-up for its next relevant boundary. */
export function useDeadlineQuery<T extends { nextDueAt: number | undefined }>(
  evaluate: (now: number) => T,
  inputs: readonly unknown[]
): T {
  const [clock, setClock] = useState(() => ({ now: Date.now(), inputs }));
  // Equivalent arrays from a caller are not new data and must not cause render retries.
  if (!lodash.isEqual(inputs, clock.inputs)) {
    // React retries this render before committing children, so input changes never expose an old-clock result.
    setClock(() => ({ now: Date.now(), inputs }));
  }
  const result = evaluate(clock.now);
  const nextAt = result.nextDueAt;
  useEffect(() => {
    if (nextAt === undefined) return;
    // One-minute checkpoints bound clock-change staleness and stay below browser timeout overflow.
    const timer = window.setTimeout(
      () => setClock((previous) => ({ ...previous, now: Date.now() })),
      Math.max(1, Math.min(nextAt - Date.now(), 60_000))
    );
    return () => window.clearTimeout(timer);
  }, [nextAt, clock]);
  useEffect(() => {
    const refresh = () => setClock((previous) => ({ ...previous, now: Date.now() }));
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return result;
}
