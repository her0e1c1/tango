import * as React from "react";
import type * as z from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useAuthUid } from "@/entities/auth";
import { type Card, cardContentSchema, editCard, useCard } from "@/entities/card";
import { CATEGORY } from "@/entities/deck";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";

const cardFormSchema = cardContentSchema.omit({ uniqueKey: true });
export type CardFormValues = z.infer<typeof cardFormSchema>;

const getCardFormValues = (card: Card): CardFormValues => ({
  frontText: card.frontText,
  backText: card.backText,
  tags: [...card.tags],
});

const areCardFormValuesEqual = (left: CardFormValues, right: CardFormValues): boolean =>
  left.frontText === right.frontText &&
  left.backText === right.backText &&
  left.tags.length === right.tags.length &&
  left.tags.every((tag, index) => tag === right.tags[index]);

interface UseCardFormOptions {
  cardId: string;
  onSaved: (deckId: Card["deckId"]) => void;
}

export const useCardForm = ({ cardId, onSaved }: UseCardFormOptions) => {
  const uid = useAuthUid();
  const card = useCard(cardId);
  const isMounted = useMountedGuard();
  const [saveError, setSaveError] = React.useState<unknown>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [failedBaseline, setFailedBaseline] = React.useState<CardFormValues | null>(null);
  const form = useForm<CardFormValues>({
    ...(card && { values: getCardFormValues(card) }),
    // Firestore can roll an optimistic snapshot back after a rejected write; that refresh must not erase the retry payload.
    resetOptions: { keepDirtyValues: true },
    resolver: zodResolver(cardFormSchema),
  });
  if (card == null) return;

  const submit = form.handleSubmit(async (values) => {
    const submittedInput = form.getValues();
    // A failed attempt keeps its pre-optimistic baseline for retries that start before Firestore rolls back.
    const retryBaseline = failedBaseline ?? getCardFormValues(card);
    setIsSaving(true);
    setSaveError(null);
    try {
      await editCard(uid, { id: card.id, ...values });
      if (isMounted()) {
        const savedBaseline = { ...values, tags: [...values.tags] };
        setFailedBaseline(null);
        if (areCardFormValuesEqual(form.getValues(), submittedInput)) {
          onSaved(card.deckId);
        } else {
          // A successful write may finish after another edit; preserve that edit against the payload just saved.
          form.reset(savedBaseline, { keepValues: true });
        }
      }
    } catch (error) {
      if (isMounted()) {
        // Optimistic snapshots may replace RHF's baseline while pending; restore it without erasing the retry payload.
        form.reset(retryBaseline, { keepValues: true });
        setFailedBaseline(retryBaseline);
        setSaveError(error);
      }
    } finally {
      if (isMounted()) setIsSaving(false);
    }
  });
  const onFormSubmit = (event?: Parameters<typeof submit>[0]) => {
    if (isSaving) {
      event?.preventDefault();
      return;
    }
    void submit(event);
  };

  const cardInfo = {
    id: card.id,
    uniqueKey: card.uniqueKey,
    ...(card.createdAt ? { createdAt: card.createdAt } : {}),
    ...(card.lastSeenAt != null ? { lastSeenAt: card.lastSeenAt } : {}),
  };

  return {
    cardInfo,
    categories: CATEGORY,
    form,
    isDirty: form.formState.isDirty,
    isSaving,
    onSubmit: onFormSubmit,
    saveError,
  };
};
