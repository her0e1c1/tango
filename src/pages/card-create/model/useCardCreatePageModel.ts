import type { BaseSyntheticEvent } from "react";

import { useAuthUid } from "@/entities/auth";
import type { CardId } from "@/entities/card";

import { dismissSaveError } from "./actions/dismissSaveError";
import { submitCardCreateForm } from "./actions/submitCardCreateForm";
import { submitCardCreation } from "./actions/submitCardCreation";
import { useCardCreateFormState } from "./useCardCreateFormState";

export const useCardCreatePageModel = (deckId: string, onCreated: (id: CardId) => void) => {
  const uid = useAuthUid();
  const { form, pending, cardId, saveErrorToastId, isMounted } = useCardCreateFormState();

  return {
    form,
    onSubmit: (event?: BaseSyntheticEvent) =>
      void submitCardCreateForm(event, form.handleSubmit, pending, (values) =>
        submitCardCreation(values, { uid, cardId, deckId, saveErrorToastId, isMounted, onCreated })
      ),
    dismissSaveError: () => dismissSaveError(saveErrorToastId),
  };
};
