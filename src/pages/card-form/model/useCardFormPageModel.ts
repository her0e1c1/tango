import type { BaseSyntheticEvent } from "react";

import type { Card } from "@/entities/card";

import { dismissSaveError } from "./actions/dismissSaveError";
import { runCardSave } from "./actions/runCardSave";
import { getCardEditorInfo } from "./queries/getCardEditorInfo";
import { useCardFormState } from "./useCardFormState";

export const useCardFormPageModel = (card: Card) => {
  const { snapshot, form, savingRef, isSaving, setIsSaving, saveErrorToastId, isMounted } = useCardFormState(card);

  return {
    cardInfo: getCardEditorInfo(snapshot),
    form,
    isSaving,
    // Bind navigation at submission time because its guard depends on this model's form state.
    submitForm: (onSaved: (deckId: Card["deckId"]) => void, event?: BaseSyntheticEvent) =>
      void form.handleSubmit((values) =>
        runCardSave(values, {
          cardId: snapshot.id,
          savingRef,
          setIsSaving,
          saveErrorToastId,
          isMounted,
          onSaved: () => onSaved(snapshot.deckId),
        })
      )(event),
    dismissSaveError: () => dismissSaveError(saveErrorToastId),
  };
};
