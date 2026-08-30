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

const areDeckFormValuesEqual = (left: DeckFormValues, right: DeckFormValues): boolean =>
  left.name === right.name &&
  left.category === right.category &&
  left.url === right.url &&
  left.convertToBr === right.convertToBr &&
  left.localMode === right.localMode;

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
  const [isSaving, setIsSaving] = React.useState(false);
  const [failedBaseline, setFailedBaseline] = React.useState<DeckFormValues | null>(null);
  const form = useForm<DeckFormValues>({
    ...(deck && { values: getDeckFormValues(deck) }),
    // Subscription refreshes may update clean fields, but must not erase the user's retry payload.
    resetOptions: { keepDirtyValues: true },
    resolver: zodResolver(deckFormSchema),
  });

  const dismissSaveError = () => dismissOwnedToast(saveErrorToastId);

  React.useEffect(() => () => dismissOwnedToast(saveErrorToastId), []);

  if (deck == null) return;

  const submit = async (values: DeckFormValues) => {
    const savedInput = { ...values };
    const submittedInput = form.getValues();
    // A failed attempt keeps its pre-optimistic baseline for retries that start before Firestore rolls back.
    const retryBaseline = failedBaseline ?? getDeckFormValues(deck);
    setIsSaving(true);
    dismissSaveError();
    try {
      await editDeck(uid, getDeckEditInput(deck, savedInput));
      // A Deck write may finish after the user leaves this Page; prevent that stale completion from navigating them.
      if (isMounted()) {
        setFailedBaseline(null);
        showToast({ message: `Updated deck “${savedInput.name}”.`, tone: "success" });
        if (areDeckFormValuesEqual(form.getValues(), submittedInput)) {
          onSaved();
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
    isDirty: form.formState.isDirty,
    isLocalOnly: deck.localMode,
    isSaving,
    onSubmit: onFormSubmit,
  };
};
