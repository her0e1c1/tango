import * as React from "react";
import type * as z from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useAuthUid } from "@/entities/auth";
import { cardContentSchema, editCard, useCard } from "@/entities/card";
import { CATEGORY } from "@/entities/deck";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { dismissToast, showToast, type ToastId } from "@/shared/ui/toast";

const cardFormSchema = cardContentSchema.omit({ uniqueKey: true });
export type CardFormValues = z.infer<typeof cardFormSchema>;

interface UseCardFormOptions {
  cardId: string;
  onSaved: () => void;
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

  const dismissSaveError = () => dismissOwnedToast(saveErrorToastId);

  React.useEffect(() => () => dismissOwnedToast(saveErrorToastId), []);

  if (card == null) return;

  const submit = async (values: CardFormValues) => {
    dismissSaveError();
    try {
      await editCard(uid, { id: card.id, ...values });
      if (isMounted()) {
        showToast({ message: `Updated card “${values.frontText}”.`, tone: "success" });
        onSaved();
      }
    } catch {
      if (isMounted()) {
        saveErrorToastId.current = showToast({ message: "Unable to save changes. Try again.", tone: "error" });
      }
    }
  };
  const onFormSubmit = (event?: React.BaseSyntheticEvent) => {
    void form.handleSubmit(submit)(event);
  };

  const cardInfo = {
    id: card.id,
    uniqueKey: card.uniqueKey,
    ...(card.createdAt ? { createdAt: card.createdAt } : {}),
    ...(card.lastSeenAt != null ? { lastSeenAt: card.lastSeenAt } : {}),
  };

  return { cardInfo, categories: CATEGORY, dismissSaveError, form, onSubmit: onFormSubmit };
};
