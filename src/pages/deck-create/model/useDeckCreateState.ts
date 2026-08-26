import * as React from "react";
import type * as z from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useGoogleAccountUid } from "@/entities/auth";
import { CATEGORY, createDeck, deckFormSchema, generateDeckId, type DeckId } from "@/entities/deck";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";

type DeckCreateFormValues = z.infer<typeof deckFormSchema>;

interface UseDeckCreateStateOptions {
  onCancel: () => void;
  onCreated: (deckId: DeckId) => void;
}

export const useDeckCreateState = ({ onCancel, onCreated }: UseDeckCreateStateOptions) => {
  const uid = useGoogleAccountUid();
  const remoteStorageAvailable = uid !== "";
  // A failed response may hide a successful write, so retries must reuse this Deck identity.
  const [deckId] = React.useState(generateDeckId);
  const isMounted = useMountedGuard();
  const [saveError, setSaveError] = React.useState<unknown>(null);
  const { formState, handleSubmit, register, setValue } = useForm<DeckCreateFormValues>({
    defaultValues: { name: "", category: "", convertToBr: false, localMode: !remoteStorageAvailable },
    resolver: zodResolver(deckFormSchema),
  });

  React.useEffect(() => {
    if (!remoteStorageAvailable) setValue("localMode", true);
  }, [remoteStorageAvailable, setValue]);

  const submit = handleSubmit(async (values) => {
    setSaveError(null);
    try {
      const deck = {
        id: deckId,
        name: values.name,
        category: values.category,
        convertToBr: values.convertToBr,
      };
      const localMode = !remoteStorageAvailable || values.localMode === true;
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
      // A retry must keep using react-hook-form's original persistence mode after a failed write.
      localMode: {
        ...register("localMode"),
        disabled: !remoteStorageAvailable || formState.isSubmitting || saveError !== null,
      },
    },
    errors: { name: formState.errors.name?.message },
    isSubmitting: formState.isSubmitting,
    remoteStorageAvailable,
    onCancel,
    onSubmit: onFormSubmit,
  };

  return { form, saveError };
};
