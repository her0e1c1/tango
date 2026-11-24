import { useRef } from "react";
import { useLifecycles, useUpdateEffect } from "react-use";
import type { DeckId } from "@/entities/deck";
import { enterStudySessionPage } from "./enterStudySessionPage";

export function useStudySessionVisit(uid: string, deckId: DeckId): void {
  const visit = useRef<{ uid: string; deckId: DeckId; leave: () => void } | undefined>(undefined);
  const enter = () => {
    const current = visit.current;
    // Strict Mode can run the update callback on initial mount.
    if (current?.uid === uid && current.deckId === deckId) return;
    current?.leave();
    visit.current = { uid, deckId, leave: enterStudySessionPage(uid, deckId) };
  };
  useLifecycles(enter, () => {
    visit.current?.leave();
    visit.current = undefined;
  });
  useUpdateEffect(enter, [uid, deckId]);
}
