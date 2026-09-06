import { useState } from "react";
import type { DeckDeletionTarget } from "./types";

export const useDeckDeletionState = () => {
  const [target, setTarget] = useState<DeckDeletionTarget>();
  const [pending, setPending] = useState(false);
  return { target, setTarget, pending, setPending };
};
