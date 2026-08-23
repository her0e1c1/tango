import * as React from "react";
import type * as z from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useAuthUid } from "@/entities/auth";
import { CATEGORY, deckFormSchema, editDeck, useDeck } from "@/entities/deck";

type DeckFormValues = z.infer<typeof deckFormSchema>;

interface UseDeckFormStateOptions {
  deckId: string;
  onCancel: () => void;
  onSaved: () => void;
}

export const useDeckFormState = ({ deckId, onCancel, onSaved }: UseDeckFormStateOptions) => {
  const uid = useAuthUid();
  const deck = useDeck(deckId);
  const [saveError, setSaveError] = React.useState<unknown>(null);
  const { formState, handleSubmit, register } = useForm<DeckFormValues>({
    ...(deck && {
      values: {
        name: deck.name,
        category: deck.category,
        url: deck.url || undefined,
        convertToBr: deck.convertToBr,
        localMode: deck.localMode,
      },
    }),
    resolver: zodResolver(deckFormSchema),
  });

  if (deck == null) return;

  const submit = handleSubmit(async (values) => {
    setSaveError(null);
    try {
      await editDeck(uid, {
        id: deck.id,
        ...values,
        localMode: values.localMode ?? deck.localMode,
        url: values.url ?? null,
      });
      onSaved();
    } catch (error) {
      setSaveError(error);
    }
  });
  const onFormSubmit = (event?: Parameters<typeof submit>[0]) => {
    void submit(event);
  };

  const form = {
    deckInfo: {
      id: deck.id,
      ...(deck.createdAt ? { createdAt: new Date(deck.createdAt).toLocaleDateString() } : {}),
      ...(deck.updatedAt ? { updatedAt: new Date(deck.updatedAt).toLocaleDateString() } : {}),
    },
    fields: {
      name: register("name"),
      convertToBr: register("convertToBr"),
      // Moving Firestore data back into browser-only storage needs a separate copy-and-delete workflow.
      localMode: { ...register("localMode"), disabled: !deck.localMode },
      // Keep optional Deck URLs absent even though an empty HTML input reports an empty string.
      url: register("url", { setValueAs: (value: unknown) => (value === "" ? undefined : value) }),
      category: {
        ...register("category"),
        options: CATEGORY.map((category) => ({ label: category, value: category })),
      },
    },
    localModeHelp: deck.localMode
      ? "Turn off to save this deck and its cards to Firestore. This change cannot be undone."
      : "This deck and its cards are saved to Firestore.",
    errors: {
      name: formState.errors.name?.message,
      url: formState.errors.url?.message,
    },
    isSubmitting: formState.isSubmitting,
    onCancel,
    onSubmit: onFormSubmit,
  };

  return { deckName: deck.name, form, saveError };
};
