import { useEffect } from "react";
import { finishDeckFilterSave } from "./actions/finishDeckFilterSave";
import type { SetDeckFilterDraft } from "./types";

export const useDeckFilterSaveLifecycle = (pending: Promise<void> | undefined, setState: SetDeckFilterDraft): void => {
  useEffect(() => {
    if (pending === undefined) return;
    let active = true;
    void pending.then(() => {
      if (active) finishDeckFilterSave(pending, setState);
    });
    return () => {
      active = false;
    };
  }, [pending, setState]);
};
