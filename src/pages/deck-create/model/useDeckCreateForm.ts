import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useAuthUid } from "@/entities/auth";
import { CATEGORY, createDeck, deckFormSchema, generateDeckId, type DeckId } from "@/entities/deck";
import type { DeckFormFields } from "@/features/deck-form";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";

interface UseDeckCreateFormOptions {
  onCreated: (deckId: DeckId) => void;
}

export const useDeckCreateForm = ({ onCreated }: UseDeckCreateFormOptions) => {
  const uid = useAuthUid();
  // A failed response may hide a successful write, so retries must reuse this Deck identity.
  const [deckId] = React.useState(generateDeckId);
  const isMounted = useMountedGuard();
  const [saveError, setSaveError] = React.useState<unknown>(null);
  const form = useForm<DeckFormFields>({
    defaultValues: { name: "", category: "", convertToBr: false, localMode: false },
    resolver: zodResolver(deckFormSchema),
  });

  const submit = form.handleSubmit(async (values) => {
    setSaveError(null);
    try {
      const deck = {
        id: deckId,
        name: values.name,
        category: values.category,
        convertToBr: values.convertToBr,
        ...(values.url === undefined ? {} : { url: values.url }),
      };
      await createDeck(uid, values.localMode ? { ...deck, localMode: true } : { ...deck, localMode: false });
      // A Deck write may finish after the user leaves this Page; prevent that stale completion from navigating them.
      if (isMounted()) onCreated(deckId);
    } catch (error) {
      setSaveError(error);
    }
  });
  const onFormSubmit = (event?: Parameters<typeof submit>[0]) => {
    void submit(event);
  };

  // A retry must keep using react-hook-form's original persistence mode after a failed write.
  const isLocalModeLocked = form.formState.isSubmitting || saveError !== null;

  return { categories: CATEGORY, form, isLocalModeLocked, onSubmit: onFormSubmit, saveError };
};
