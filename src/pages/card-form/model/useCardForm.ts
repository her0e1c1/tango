import * as React from "react";
import type * as z from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useAuthUid } from "@/entities/auth";
import { type Card, cardContentSchema, editCard, useCard } from "@/entities/card";
import { CATEGORY } from "@/entities/deck";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { dismissToast, showToast, type ToastId } from "@/shared/ui/toast";

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

const dismissOwnedToast = (toastId: React.RefObject<ToastId | undefined>) => {
  const id = toastId.current;
  if (id === undefined) return;
  dismissToast(id);
  toastId.current = undefined;
};

export const useCardForm = ({ cardId, onSaved }: UseCardFormOptions) => {
  const uid = useAuthUid();
  const card = useCard(cardId);
  const isMounted = useMountedGuard();
  const saveErrorToastId = React.useRef<ToastId | undefined>(undefined);
  const [isSaving, setIsSaving] = React.useState(false);
  const [failedBaseline, setFailedBaseline] = React.useState<CardFormValues | null>(null);
  const form = useForm<CardFormValues>({
    ...(card && { values: getCardFormValues(card) }),
    // Firestore can roll an optimistic snapshot back after a rejected write; that refresh must not erase the retry payload.
    resetOptions: { keepDirtyValues: true },
    resolver: zodResolver(cardFormSchema),
  });
  const dismissSaveError = () => dismissOwnedToast(saveErrorToastId);

  React.useEffect(() => () => dismissOwnedToast(saveErrorToastId), []);

  if (card == null) return;

  const submit = async (values: CardFormValues) => {
    const savedInput = { ...values, tags: [...values.tags] };
    const submittedInput = form.getValues();
    // A failed attempt keeps its pre-optimistic baseline for retries that start before Firestore rolls back.
    const retryBaseline = failedBaseline ?? getCardFormValues(card);
    setIsSaving(true);
    dismissSaveError();
    try {
      await editCard(uid, { id: card.id, ...savedInput });
      if (isMounted()) {
        setFailedBaseline(null);
        showToast({ message: `Updated card “${savedInput.frontText}”.`, tone: "success" });
        if (areCardFormValuesEqual(form.getValues(), submittedInput)) {
          onSaved(card.deckId);
        } else {
          // A successful write may finish after another edit; preserve that edit against the payload just saved.
          form.reset(savedInput, { keepValues: true });
        }
      }
    } catch {
      if (isMounted()) {
        // Optimistic snapshots may replace RHF's baseline while pending; restore it without erasing the retry payload.
        form.reset(retryBaseline, { keepValues: true });
        setFailedBaseline(retryBaseline);
        saveErrorToastId.current = showToast({ message: "Unable to save changes. Try again.", tone: "error" });
      }
    } finally {
      if (isMounted()) setIsSaving(false);
    }
  };
  const onFormSubmit = (event?: React.BaseSyntheticEvent) => {
    if (isSaving) {
      event?.preventDefault();
      return;
    }
    void form.handleSubmit(submit)(event);
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
    dismissSaveError,
    form,
    isDirty: form.formState.isDirty,
    isSaving,
    onSubmit: onFormSubmit,
  };
};
