import type * as React from "react";
import { useFormState } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { useAuthUid } from "@/entities/auth";
import { CATEGORY, type Deck } from "@/entities/deck";
import { routes } from "@/shared/router";

import { dismissSaveError } from "../model/actions/dismissSaveError";
import { submitCardCreation } from "../model/actions/submitCardCreation";
import { useCardCreateFormState } from "../model/useCardCreateFormState";
import { CardCreator } from "./CardCreator";

interface CardCreateContainerProps {
  deck: Deck;
}

export const CardCreateContainer: React.FC<CardCreateContainerProps> = ({ deck }) => {
  const navigate = useNavigate();
  const destination = routes.cardList.to(deck.id);
  const uid = useAuthUid();
  const { form, saveErrorToastId, isMounted, cardId, pending } = useCardCreateFormState();
  const { isSubmitting } = useFormState({ control: form.control });
  const onSubmit: React.SubmitEventHandler<HTMLFormElement> = (event) => {
    void submitCardCreation(event, {
      uid,
      handleSubmit: form.handleSubmit,
      saveErrorToastId,
      isMounted,
      cardId,
      deckId: deck.id,
      pending,
      onCreated: () => void navigate(destination, { replace: true }),
    });
  };
  const onCancel = () => {
    dismissSaveError(saveErrorToastId);
    void navigate(destination);
  };

  return (
    <CardCreator
      categories={CATEGORY}
      deckName={deck.name}
      form={form}
      isSubmitting={isSubmitting}
      onCancel={onCancel}
      onSubmit={onSubmit}
    />
  );
};
