import type { Deck } from "@/entities/deck";
import type { DeckFormFields } from "@/features/deck-form";

import { deckEditPageStore } from "../store";
import { saveDeck } from "./saveDeck";

interface SubmitDeckEditInput {
  owner: symbol | undefined;
  deckId: Deck["id"];
  values: DeckFormFields;
  onSaved: () => void | Promise<void>;
}

export function submitDeckEdit({ owner, deckId, values, onSaved }: SubmitDeckEditInput): Promise<void> {
  const state = deckEditPageStore.getState();
  // Validation can finish after the originating form was replaced, including by the same Deck.
  if (owner === undefined || state.owner !== owner) return Promise.resolve();
  // Every concurrent caller must await the same save so its form stays pending until completion.
  if (state.submission !== undefined) return state.submission;

  const submission = saveDeck({ deckId, values })
    .then(async (saved) => {
      if (saved && deckEditPageStore.getState().owner === owner) await onSaved();
    })
    .catch((error: unknown) => {
      // biome-ignore lint/suspicious/noConsole: Completion callback errors are not persistence failures.
      console.error("Deck edit submission failed.", error);
    })
    .finally(() => {
      // An earlier visit must never release the current editor's save.
      if (deckEditPageStore.getState().owner === owner) deckEditPageStore.setState({ submission: undefined });
    });
  deckEditPageStore.setState({ submission });
  return submission;
}
