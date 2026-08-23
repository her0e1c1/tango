import * as React from "react";
import type * as z from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useAuthUid } from "@/entities/auth";
import { CATEGORY, createDeck, deckFormSchema, generateDeckId, type DeckId } from "@/entities/deck";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";

type DeckCreateFormValues = z.infer<typeof deckFormSchema>;

interface UseDeckCreateStateOptions {
  onCancel: () => void;
  onCreated: (deckId: DeckId) => void;
}

export const useDeckCreateState = ({ onCancel, onCreated }: UseDeckCreateStateOptions) => {
  const uid = useAuthUid();
  // A failed response may hide a successful write, so retries must reuse both identity and storage mode.
  const [deckId] = React.useState(generateDeckId);
  const [fixedLocalMode, setFixedLocalMode] = React.useState<boolean>();
  const isMounted = useMountedGuard();
  const [saveError, setSaveError] = React.useState<unknown>(null);
  const { formState, handleSubmit, register } = useForm<DeckCreateFormValues>({
    defaultValues: { name: "", category: "", convertToBr: false, localMode: false },
    resolver: zodResolver(deckFormSchema),
  });

  const submit = handleSubmit(async (values) => {
    setSaveError(null);
    const localMode = fixedLocalMode ?? values.localMode ?? false;
    if (fixedLocalMode === undefined) setFixedLocalMode(localMode);
    try {
      const deck = {
        id: deckId,
        name: values.name,
        category: values.category,
        convertToBr: values.convertToBr,
      };
      await createDeck(uid, localMode ? { ...deck, localMode: true } : { ...deck, uid, localMode: false });
      // A Deck write may finish after the user leaves this Page; prevent that stale completion from navigating them.
      if (isMounted()) onCreated(deckId);
    } catch (error) {
      setSaveError(error);
    }
  });
  const onFormSubmit = (event?: Parameters<typeof submit>[0]) => {
    void submit(event);
  };

  const form = {
    fields: {
      name: register("name"),
      category: {
        ...register("category"),
        options: CATEGORY.map((category) => ({ label: category, value: category })),
      },
      localMode: { ...register("localMode"), disabled: fixedLocalMode !== undefined },
    },
    errors: { name: formState.errors.name?.message },
    isSubmitting: formState.isSubmitting,
    onCancel,
    onSubmit: onFormSubmit,
  };

  return { form, saveError };
};
