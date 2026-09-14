import type { SubmitEvent } from "react";
import type { UseFormHandleSubmit } from "react-hook-form";

import type { Deck } from "@/entities/deck";
import type { DeckFormFields } from "@/features/deck-form";

import type { DeckFormPageStore } from "../store";
import { saveDeck } from "./saveDeck";

interface SubmitDeckFormInput {
  deckId: Deck["id"];
  localMode: Deck["localMode"];
  handleSubmit: UseFormHandleSubmit<DeckFormFields>;
  store: DeckFormPageStore;
  isMounted: () => boolean;
  onSaved: () => void | Promise<void>;
}

export async function submitDeckForm(
  event: SubmitEvent<HTMLFormElement>,
  { deckId, localMode, handleSubmit, store, isMounted, onSaved }: SubmitDeckFormInput
): Promise<void> {
  if (store.getState().submissionPending) {
    event.preventDefault();
    return;
  }

  // RHF validation is asynchronous, so lock the entrance before isSubmitting can rerender the form.
  store.setState({ submissionPending: true });
  try {
    await handleSubmit(async (values) => {
      const saved = await saveDeck({ deckId, localMode, values });
      if (saved && isMounted()) await onSaved();
    })(event);
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: Unexpected validation/navigation errors are not persistence failures.
    console.error("Deck edit form callback failed.", error);
  } finally {
    store.setState({ submissionPending: false });
  }
}
