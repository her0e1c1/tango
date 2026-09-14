import type { SubmitEvent } from "react";
import type { UseFormHandleSubmit } from "react-hook-form";

import type { Deck } from "@/entities/deck";
import type { DeckFormFields } from "@/features/deck-form";

import { deckFormPageStore } from "../store";
import { saveDeck } from "./saveDeck";

interface SubmitDeckFormInput {
  deckId: Deck["id"];
  localMode: Deck["localMode"];
  handleSubmit: UseFormHandleSubmit<DeckFormFields>;
  onSaved: () => void | Promise<void>;
}

export async function submitDeckForm(
  event: SubmitEvent<HTMLFormElement>,
  { deckId, localMode, handleSubmit, onSaved }: SubmitDeckFormInput
): Promise<void> {
  const { owner, submissionPending } = deckFormPageStore.getState();
  if (owner === undefined || submissionPending) {
    event.preventDefault();
    return;
  }

  // RHF validation is asynchronous, so lock the entrance before isSubmitting can rerender the form.
  deckFormPageStore.setState({ submissionPending: true });
  try {
    await handleSubmit(async (values) => {
      const saved = await saveDeck({ deckId, localMode, values });
      if (saved && deckFormPageStore.getState().owner === owner) await onSaved();
    })(event);
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: Unexpected validation/navigation errors are not persistence failures.
    console.error("Deck edit form callback failed.", error);
  } finally {
    // Persistence can outlive its visit; its completion must not release a newer submission's lock.
    if (deckFormPageStore.getState().owner === owner) deckFormPageStore.setState({ submissionPending: false });
  }
}
