import type { Deck } from "@/entities/deck";
import type { DeckFormFields } from "@/features/deck-form";

import { deckFormPageStore } from "../store";
import { saveDeck } from "./saveDeck";

interface SubmitDeckFormInput {
  deckId: Deck["id"];
  localMode: Deck["localMode"];
  values: DeckFormFields;
  onSaved: () => void | Promise<void>;
}

export async function submitDeckForm({ deckId, localMode, values, onSaved }: SubmitDeckFormInput): Promise<void> {
  const { owner, submissionPending } = deckFormPageStore.getState();
  if (owner === undefined || submissionPending) return;

  deckFormPageStore.setState({ submissionPending: true });
  try {
    const saved = await saveDeck({ deckId, localMode, values });
    if (saved && deckFormPageStore.getState().owner === owner) await onSaved();
  } finally {
    // Persistence can outlive its visit; its completion must not release a newer submission's lock.
    if (deckFormPageStore.getState().owner === owner) deckFormPageStore.setState({ submissionPending: false });
  }
}
