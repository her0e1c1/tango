import { useEffect, useRef, useState } from "react";

type DeckImportStatus = "idle" | "validating" | "importing";
type ActiveDeckImportStatus = Exclude<DeckImportStatus, "idle">;

interface DeckImportOperationState {
  uid: string;
  status: DeckImportStatus;
}

interface DeckImportLock {
  running: boolean;
}

export interface DeckImportOperationScope {
  isCurrent: () => boolean;
}

const initialState = (uid: string): DeckImportOperationState => ({ uid, status: "idle" });
const createLock = (): DeckImportLock => ({ running: false });

export const useDeckImportOperation = (uid: string) => {
  // A generation distinguishes stale async work even after an A-to-B-to-A auth transition.
  const generationRef = useRef(0);
  // The lock changes synchronously so callers cannot overlap before React publishes status.
  const lockRef = useRef<DeckImportLock>(createLock());
  const [state, setState] = useState<DeckImportOperationState>(() => initialState(uid));

  if (state.uid !== uid) setState(initialState(uid));
  const status = state.uid === uid ? state.status : "idle";

  useEffect(() => {
    generationRef.current += 1;
    lockRef.current.running = false;
  }, [uid]);

  const run = async <Result>(
    nextStatus: ActiveDeckImportStatus,
    task: (scope: DeckImportOperationScope) => Promise<Result>
  ) => {
    if (lockRef.current.running) throw new Error("A Deck import is already running");

    const generation = generationRef.current;
    const isCurrent = () => generation === generationRef.current;
    lockRef.current.running = true;
    setState({ uid, status: nextStatus });

    try {
      return await task({ isCurrent });
    } finally {
      if (isCurrent()) {
        lockRef.current.running = false;
        setState({ uid, status: "idle" });
      }
    }
  };

  return { status, isRunning: () => lockRef.current.running, run };
};
