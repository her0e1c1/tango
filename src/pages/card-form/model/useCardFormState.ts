import * as React from "react";
import type * as z from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useGoogleAccountUid } from "@/entities/auth";
import { cardContentSchema, editCard, useCard } from "@/entities/card";
import { CATEGORY } from "@/entities/deck";

const cardFormSchema = cardContentSchema.omit({ uniqueKey: true });
type CardFormValues = z.infer<typeof cardFormSchema>;

interface UseCardFormStateOptions {
  cardId: string;
  onCancel: () => void;
  onSaved: () => void;
}

export const useCardFormState = ({ cardId, onCancel, onSaved }: UseCardFormStateOptions) => {
  const uid = useGoogleAccountUid();
  const card = useCard(cardId);
  const [saveError, setSaveError] = React.useState<unknown>(null);
  const { formState, handleSubmit, register } = useForm<CardFormValues>({
    ...(card && {
      values: {
        frontText: card.frontText,
        backText: card.backText,
        tags: card.tags,
      },
    }),
    // Firestore can roll an optimistic snapshot back after a rejected write; that refresh must not erase the retry payload.
    resetOptions: { keepDirtyValues: true },
    resolver: zodResolver(cardFormSchema),
  });

  if (card == null) return;

  const submit = handleSubmit(async (values) => {
    setSaveError(null);
    try {
      await editCard(uid, { id: card.id, ...values });
      onSaved();
    } catch (error) {
      setSaveError(error);
    }
  });
  const onFormSubmit = (event?: Parameters<typeof submit>[0]) => {
    void submit(event);
  };

  const form = {
    cardInfo: {
      id: card.id,
      uniqueKey: card.uniqueKey,
      ...(card.createdAt ? { createdAt: new Date(card.createdAt).toLocaleDateString() } : {}),
      ...(card.lastSeenAt != null ? { lastSeenAt: new Date(card.lastSeenAt).toLocaleDateString() } : {}),
    },
    fields: {
      frontText: register("frontText"),
      backText: register("backText"),
      tags: CATEGORY.map((category) => ({
        label: category,
        value: category,
        input: { ...register("tags"), value: category },
      })),
    },
    errors: {
      frontText: formState.errors.frontText?.message,
      backText: formState.errors.backText?.message,
    },
    isSubmitting: formState.isSubmitting,
    onCancel,
    onSubmit: onFormSubmit,
  };

  return { form, saveError };
};
