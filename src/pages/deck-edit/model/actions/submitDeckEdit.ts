import type { Deck } from "@/entities/deck";
import type { DeckFormFields } from "@/features/deck-form";

import { deckEditPageStore } from "../store";
import { saveDeck } from "./saveDeck";

interface SubmitDeckEditInput {
  isMounted: () => boolean;
  deckId: Deck["id"];
  values: DeckFormFields;
  onSaved: () => void | Promise<void>;
}

export function submitDeckEdit({ isMounted, deckId, values, onSaved }: SubmitDeckEditInput): Promise<void> {
  const state = deckEditPageStore.getState();
  // Validation can finish after the originating form was replaced, including by the same Deck.
  if (!isMounted()) return Promise.resolve();
  // Every concurrent caller must await the same save so its form stays pending until completion.
  if (state.submission !== undefined) return state.submission;

  const submission = saveDeck({ deckId, values })
    .then(async (saved) => {
      if (saved && isMounted() && deckEditPageStore.getState().submission === submission) await onSaved();
    })
    .catch((error: unknown) => {
      // biome-ignore lint/suspicious/noConsole: Completion callback errors are not persistence failures.
      console.error("Deck edit submission failed.", error);
    })
    .finally(() => {
      // An earlier visit must never release the current editor's save.
      if (deckEditPageStore.getState().submission === submission) deckEditPageStore.setState({ submission: undefined });
    });
  deckEditPageStore.setState({ submission });
  return submission;
}
