import { useEffect, useState } from "react";

// Browsers clamp longer delays; capped timers reschedule until the requested update time is reached.
const MAX_TIMEOUT_MS = 2_147_483_647;

export const useTimeDependentValue = <Value>(
  resolve: (now: number) => { value: Value; nextUpdateAt: number | undefined }
): Value => {
  const [now, setNow] = useState(() => Date.now());
  const resolved = resolve(now);

  useEffect(() => {
    if (resolved.nextUpdateAt === undefined) return;

    const delay = Math.min(Math.max(resolved.nextUpdateAt - Date.now(), 0), MAX_TIMEOUT_MS);
    const update = window.setTimeout(() => setNow(Date.now()), delay);
    return () => window.clearTimeout(update);
  }, [now, resolved.nextUpdateAt]);

  return resolved.value;
};
