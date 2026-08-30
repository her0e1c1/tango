import * as React from "react";
import type * as z from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useAuthUid } from "@/entities/auth";
import { cardContentSchema, editCard, useCard } from "@/entities/card";
import { CATEGORY } from "@/entities/deck";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";

const cardFormSchema = cardContentSchema.omit({ uniqueKey: true });
export type CardFormValues = z.infer<typeof cardFormSchema>;

interface UseCardFormOptions {
  cardId: string;
  onSaved: () => void;
}

export const useCardForm = ({ cardId, onSaved }: UseCardFormOptions) => {
  const uid = useAuthUid();
  const card = useCard(cardId);
  const isMounted = useMountedGuard();
  const [saveError, setSaveError] = React.useState<unknown>(null);
  const form = useForm<CardFormValues>({
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

  const submit = form.handleSubmit(async (values) => {
    setSaveError(null);
    try {
      await editCard(uid, { id: card.id, ...values });
      // A Card write may finish after the user discards the form; do not navigate from that stale Page.
      if (isMounted()) onSaved();
    } catch (error) {
      if (isMounted()) setSaveError(error);
    }
  });
  const onFormSubmit = (event?: Parameters<typeof submit>[0]) => {
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
    onSubmit: onFormSubmit,
    saveError,
  };
};
