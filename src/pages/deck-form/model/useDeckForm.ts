import * as React from "react";
import type * as z from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useAuthUid } from "@/entities/auth";
import { CATEGORY, type Deck, deckFormSchema, editDeck, useDeck } from "@/entities/deck";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { dismissToast, showToast, type ToastId } from "@/shared/ui/toast";

export type DeckFormValues = z.infer<typeof deckFormSchema>;

const getDeckFormValues = (deck: Deck): DeckFormValues => ({
  name: deck.name,
  category: deck.category,
  url: deck.url || undefined,
  convertToBr: deck.convertToBr,
  localMode: deck.localMode,
});

const getDeckEditInput = (deck: Deck, values: DeckFormValues): Parameters<typeof editDeck>[1] => ({
  id: deck.id,
  ...values,
  localMode: values.localMode ?? deck.localMode,
  url: values.url ?? null,
});

interface UseDeckFormOptions {
  deckId: string;
  onSaved: () => void;
}

const dismissOwnedToast = (toastId: React.RefObject<ToastId | undefined>) => {
  const id = toastId.current;
  if (id === undefined) return;
  dismissToast(id);
  toastId.current = undefined;
};

export const useDeckForm = ({ deckId, onSaved }: UseDeckFormOptions) => {
  const uid = useAuthUid();
  const deck = useDeck(deckId);
  const isMounted = useMountedGuard();
  const saveErrorToastId = React.useRef<ToastId | undefined>(undefined);
  const form = useForm<DeckFormValues>({
    ...(deck && { values: getDeckFormValues(deck) }),
    // A rejected optimistic snapshot may roll the Entity back; that refresh must not erase the retry payload.
    resetOptions: { keepDirtyValues: true },
    resolver: zodResolver(deckFormSchema),
  });

  const dismissSaveError = () => dismissOwnedToast(saveErrorToastId);

  React.useEffect(() => () => dismissOwnedToast(saveErrorToastId), []);

  if (deck == null) return;

  const submit = async (values: DeckFormValues) => {
    dismissSaveError();
    try {
      await editDeck(uid, getDeckEditInput(deck, values));
      // A Deck write may finish after the user leaves this Page; prevent that stale completion from navigating them.
      if (isMounted()) {
        showToast({ message: `Updated deck “${values.name}”.`, tone: "success" });
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

  const deckInfo = {
    id: deck.id,
    createdAt: deck.createdAt,
    updatedAt: deck.updatedAt,
  };

  return {
    categories: CATEGORY,
    deckInfo,
    deckName: deck.name,
    dismissSaveError,
    form,
    isLocalOnly: deck.localMode,
    onSubmit: onFormSubmit,
  };
};
