import type { Deck } from "@/entities/deck";
import type { DeckFormFields } from "@/features/deck-form";

import { deckFormPageStore } from "../store";
import { saveDeck } from "./saveDeck";

interface SubmitDeckFormInput {
  owner: symbol | undefined;
  deckId: Deck["id"];
  values: DeckFormFields;
  onSaved: () => void | Promise<void>;
}

export function submitDeckForm({ owner, deckId, values, onSaved }: SubmitDeckFormInput): Promise<void> {
  const state = deckFormPageStore.getState();
  // Validation can finish after the originating form was replaced, including by the same Deck.
  if (owner === undefined || state.owner !== owner) return Promise.resolve();
  // Every concurrent caller must await the same save so its form stays pending until completion.
  if (state.submission !== undefined) return state.submission;

  const submission = saveDeck({ deckId, values })
    .then(async (saved) => {
      if (saved && deckFormPageStore.getState().owner === owner) await onSaved();
    })
    .catch((error: unknown) => {
      // biome-ignore lint/suspicious/noConsole: Completion callback errors are not persistence failures.
      console.error("Deck edit submission failed.", error);
    })
    .finally(() => {
      // An earlier visit must never release the current editor's save.
      if (deckFormPageStore.getState().owner === owner) deckFormPageStore.setState({ submission: undefined });
    });
  deckFormPageStore.setState({ submission });
  return submission;
}
