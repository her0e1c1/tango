import * as React from "react";
import type * as z from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useGoogleAccountUid } from "@/entities/auth";
import { CATEGORY, type Deck, deckFormSchema, editDeck, useDeck } from "@/entities/deck";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";

type DeckFormValues = z.infer<typeof deckFormSchema>;

const categoryOptions = CATEGORY.map((category) => ({ label: category, value: category }));

const getDeckFormValues = (deck: Deck): DeckFormValues => ({
  name: deck.name,
  category: deck.category,
  url: deck.url || undefined,
  convertToBr: deck.convertToBr,
  localMode: deck.localMode,
});

const getDeckEditInput = (
  deck: Deck,
  values: DeckFormValues,
  remoteStorageAvailable: boolean
): Parameters<typeof editDeck>[1] => ({
  id: deck.id,
  ...values,
  localMode: deck.localMode && !remoteStorageAvailable ? true : (values.localMode ?? deck.localMode),
  url: values.url ?? null,
});

interface UseDeckFormStateOptions {
  deckId: string;
  onCancel: () => void;
  onSaved: () => void;
}

export const useDeckFormState = ({ deckId, onCancel, onSaved }: UseDeckFormStateOptions) => {
  const uid = useGoogleAccountUid();
  const remoteStorageAvailable = uid !== "";
  const deck = useDeck(deckId);
  const isMounted = useMountedGuard();
  const [saveError, setSaveError] = React.useState<unknown>(null);
  const { formState, handleSubmit, register, setValue } = useForm<DeckFormValues>({
    ...(deck && { values: getDeckFormValues(deck) }),
    resolver: zodResolver(deckFormSchema),
  });

  React.useLayoutEffect(() => {
    if (deck?.localMode === true && !remoteStorageAvailable) setValue("localMode", true);
  }, [deck?.localMode, remoteStorageAvailable, setValue]);

  if (deck == null) return;

  const submit = handleSubmit(async (values) => {
    setSaveError(null);
    try {
      await editDeck(uid, getDeckEditInput(deck, values, remoteStorageAvailable));
      // A Deck write may finish after the user leaves this Page; prevent that stale completion from navigating them.
      if (isMounted()) onSaved();
    } catch (error) {
      if (isMounted()) setSaveError(error);
    }
  });
  const onFormSubmit = (event?: Parameters<typeof submit>[0]) => {
    void submit(event);
  };

  const form = {
    deckInfo: {
      id: deck.id,
      createdAt: deck.createdAt,
      updatedAt: deck.updatedAt,
    },
    fields: {
      name: register("name"),
      convertToBr: register("convertToBr"),
      // Moving Firestore data back into browser-only storage needs a separate copy-and-delete workflow.
      localMode: { ...register("localMode"), disabled: !(deck.localMode && remoteStorageAvailable) },
      // Keep optional Deck URLs absent even though an empty HTML input reports an empty string.
      url: register("url", { setValueAs: (value: unknown) => (value === "" ? undefined : value) }),
      category: {
        ...register("category"),
        options: categoryOptions,
      },
    },
    isLocalOnly: deck.localMode,
    remoteStorageAvailable,
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
