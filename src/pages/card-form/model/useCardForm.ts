import * as React from "react";
import type * as z from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useAuthUid } from "@/entities/auth";
import { type Card, cardContentSchema, editCard } from "@/entities/card";
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

interface UseCardFormOptions {
  card: Card;
  onSaved: (deckId: Card["deckId"]) => void;
}

export const useCardForm = ({ card, onSaved }: UseCardFormOptions) => {
  const uid = useAuthUid();
  const isMounted = useMountedGuard();
  // The edit form owns the snapshot it opened with; subscription refreshes do not merge into a user's draft.
  const [snapshot] = React.useState(card);
  const saveErrorToastId = React.useRef<ToastId | undefined>(undefined);
  const savingRef = React.useRef(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const form = useForm<CardFormValues>({
    defaultValues: getCardFormValues(snapshot),
    resolver: zodResolver(cardFormSchema),
  });

  const dismissSaveError = () => {
    if (saveErrorToastId.current === undefined) return;
    dismissToast(saveErrorToastId.current);
    saveErrorToastId.current = undefined;
  };

  React.useEffect(() => () => dismissSaveError(), []);

  const submit = async (values: CardFormValues) => {
    // biome-ignore lint/suspicious/noUnnecessaryConditions: React Hook Form can validate two same-tick submits before rerendering.
    if (savingRef.current) return;
    const savedInput = { ...values, tags: [...values.tags] };
    savingRef.current = true;
    setIsSaving(true);
    dismissSaveError();
    try {
      await editCard(uid, { id: snapshot.id, ...savedInput });
      if (isMounted()) {
        showToast({ message: `Updated card “${savedInput.frontText}”.`, tone: "success" });
        onSaved(snapshot.deckId);
      }
    } catch {
      if (isMounted()) {
        saveErrorToastId.current = showToast({ message: "Unable to save changes. Try again.", tone: "error" });
      }
    } finally {
      savingRef.current = false;
      if (isMounted()) setIsSaving(false);
    }
  };

  const onFormSubmit = (event?: React.BaseSyntheticEvent) => {
    void form.handleSubmit(submit)(event);
  };

  return {
    cardInfo: {
      id: snapshot.id,
      uniqueKey: snapshot.uniqueKey,
      ...(snapshot.createdAt ? { createdAt: snapshot.createdAt } : {}),
      ...(snapshot.lastSeenAt != null ? { lastSeenAt: snapshot.lastSeenAt } : {}),
    },
    categories: CATEGORY,
    dismissSaveError,
    form,
    isDirty: form.formState.isDirty,
    isSaving,
    onSubmit: onFormSubmit,
  };
};
