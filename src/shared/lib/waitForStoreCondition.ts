export function waitForStoreCondition(
  subscribe: (onChange: () => void) => () => void,
  isReady: () => boolean,
  signal: AbortSignal
): Promise<boolean> {
  return new Promise((resolve) => {
    function check() {
      const ready = isReady();
      if (!signal.aborted && !ready) return;
      stop();
      signal.removeEventListener("abort", check);
      resolve(!signal.aborted && ready);
    }
    const stop = subscribe(check);
    signal.addEventListener("abort", check, { once: true });
    check();
  });
}
