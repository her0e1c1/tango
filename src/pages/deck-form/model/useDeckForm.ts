import * as React from "react";
import type * as z from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useAuthUid } from "@/entities/auth";
import { CATEGORY, type Deck, deckFormSchema, editDeck, useDeck } from "@/entities/deck";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";

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

export const useDeckForm = ({ deckId, onSaved }: UseDeckFormOptions) => {
  const uid = useAuthUid();
  const deck = useDeck(deckId);
  const isMounted = useMountedGuard();
  const [saveError, setSaveError] = React.useState<unknown>(null);
  const form = useForm<DeckFormValues>({
    ...(deck && { values: getDeckFormValues(deck) }),
    resolver: zodResolver(deckFormSchema),
  });

  if (deck == null) return;

  const submit = form.handleSubmit(async (values) => {
    setSaveError(null);
    try {
      await editDeck(uid, getDeckEditInput(deck, values));
      // A Deck write may finish after the user leaves this Page; prevent that stale completion from navigating them.
      if (isMounted()) onSaved();
    } catch (error) {
      if (isMounted()) setSaveError(error);
    }
  });
  const onFormSubmit = (event?: Parameters<typeof submit>[0]) => {
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
    isLocalOnly: deck.localMode,
    onSubmit: onFormSubmit,
    saveError,
  };
};
