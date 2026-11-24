import { useRef } from "react";
import { useLifecycles } from "react-use";

/** Lets every operation started by a mounted view share its cancellation lifetime. */
export function useMountedAbortSignal(): () => AbortSignal | undefined {
  const controller = useRef<AbortController | undefined>(undefined);
  useLifecycles(
    () => {
      controller.current = new AbortController();
    },
    () => {
      controller.current?.abort();
      controller.current = undefined;
    }
  );
  return () => controller.current?.signal;
}
