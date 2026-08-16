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

const initialState = (uid: string): DeckImportOperationState => ({ uid, status: "idle" });
const createLock = (): DeckImportLock => ({ running: false });

export const useDeckImportOperation = (uid: string) => {
  // The generation invalidates stale async work even when auth changes A-to-B-to-A.
  const generationRef = useRef(0);
  // The lock updates synchronously so operations cannot overlap before React publishes status.
  const lockRef = useRef<DeckImportLock>(createLock());
  const [state, setState] = useState<DeckImportOperationState>(() => initialState(uid));

  if (state.uid !== uid) setState(initialState(uid));
  const currentState = state.uid === uid ? state : initialState(uid);

  useEffect(() => {
    generationRef.current += 1;
    lockRef.current.running = false;
  }, [uid]);

  const isCurrent = (generation: number) => generation === generationRef.current;

  return {
    status: currentState.status,
    isRunning: () => lockRef.current.running,
    isCurrent,
    assertCurrent: (generation: number) => {
      if (!isCurrent(generation)) throw new Error("Deck import user changed before the preview could finish");
    },
    start: (status: ActiveDeckImportStatus) => {
      if (lockRef.current.running) throw new Error("A Deck import is already running");

      lockRef.current.running = true;
      setState((current) => ({ ...(current.uid === uid ? current : initialState(uid)), status }));
      return generationRef.current;
    },
    finish: (generation: number) => {
      if (!isCurrent(generation)) return;

      lockRef.current.running = false;
      setState((current) => ({ ...(current.uid === uid ? current : initialState(uid)), status: "idle" }));
    },
  };
};

export type DeckImportOperation = ReturnType<typeof useDeckImportOperation>;
