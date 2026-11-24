import { useAsync } from "react-use";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { finishDeckFilterSave } from "./actions/finishDeckFilterSave";
import type { SetDeckFilterDraft } from "./types";

export const useDeckFilterSaveLifecycle = (pending: Promise<void> | undefined, setState: SetDeckFilterDraft): void => {
  const isMounted = useMountedGuard();
  useAsync(async () => {
    if (pending === undefined) return;
    await pending;
    if (isMounted()) finishDeckFilterSave(pending, setState);
  }, [pending, setState, isMounted]);
};
