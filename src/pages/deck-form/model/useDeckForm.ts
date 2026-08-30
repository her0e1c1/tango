import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useAuthUid } from "@/entities/auth";
import { CATEGORY, type Deck, deckFormSchema, editDeck, useDeck } from "@/entities/deck";
import type { DeckFormFields } from "@/features/deck-form";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";

const getDeckFormValues = (deck: Deck): DeckFormFields => ({
  name: deck.name,
  category: deck.category,
  url: deck.url || undefined,
  convertToBr: deck.convertToBr,
  localMode: deck.localMode,
});

const getDeckEditInput = (deck: Deck, values: DeckFormFields): Parameters<typeof editDeck>[1] => ({
  id: deck.id,
  ...values,
  localMode: values.localMode ?? deck.localMode,
  url: values.url ?? null,
});

const areDeckFormValuesEqual = (left: DeckFormFields, right: DeckFormFields): boolean =>
  left.name === right.name &&
  left.category === right.category &&
  left.url === right.url &&
  left.convertToBr === right.convertToBr &&
  left.localMode === right.localMode;

interface UseDeckFormOptions {
  deckId: string;
  onSaved: () => void;
}

export const useDeckForm = ({ deckId, onSaved }: UseDeckFormOptions) => {
  const uid = useAuthUid();
  const deck = useDeck(deckId);
  const isMounted = useMountedGuard();
  const [saveError, setSaveError] = React.useState<unknown>(null);
  // Reactive Deck snapshots can reset RHF state mid-write, so this lock must span the persistence request itself.
  const [isSaving, setIsSaving] = React.useState(false);
  const [failedBaseline, setFailedBaseline] = React.useState<DeckFormFields | null>(null);
  const form = useForm<DeckFormFields>({
    ...(deck && { values: getDeckFormValues(deck) }),
    // Subscription refreshes may update clean fields, but must not erase the user's retry payload.
    resetOptions: { keepDirtyValues: true },
    resolver: zodResolver(deckFormSchema),
  });
  if (deck == null) return;

  const submit = form.handleSubmit(async (values) => {
    const submittedInput = form.getValues();
    // A failed attempt keeps its pre-optimistic baseline for retries that start before Firestore rolls back.
    const retryBaseline = failedBaseline ?? getDeckFormValues(deck);
    setIsSaving(true);
    setSaveError(null);
    try {
      await editDeck(uid, getDeckEditInput(deck, values));
      if (isMounted()) {
        const savedBaseline = { ...values };
        setFailedBaseline(null);
        if (areDeckFormValuesEqual(form.getValues(), submittedInput)) {
          onSaved();
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

  const deckInfo = {
    id: deck.id,
    createdAt: deck.createdAt,
    updatedAt: deck.updatedAt,
  };

  return {
    categories: CATEGORY,
    deckInfo,
    deckName: deck.name,
    form,
    isDirty: form.formState.isDirty,
    isLocalOnly: deck.localMode,
    isSaving,
    onSubmit: onFormSubmit,
    saveError,
  };
};
