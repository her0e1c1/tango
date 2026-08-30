import * as React from "react";
import type * as z from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useAuthUid } from "@/entities/auth";
import { CATEGORY, createDeck, deckFormSchema, generateDeckId, type DeckId } from "@/entities/deck";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { dismissToast, showToast, type ToastId } from "@/shared/ui/toast";

export type DeckCreateFormValues = z.infer<typeof deckFormSchema>;

interface UseDeckCreateFormOptions {
  onCreated: (deckId: DeckId) => void;
}

const dismissOwnedToast = (toastId: React.RefObject<ToastId | undefined>) => {
  const id = toastId.current;
  if (id === undefined) return;
  dismissToast(id);
  toastId.current = undefined;
};

export const useDeckCreateForm = ({ onCreated }: UseDeckCreateFormOptions) => {
  const uid = useAuthUid();
  // A failed response may hide a successful write, so retries must reuse this Deck identity.
  const [deckId] = React.useState(generateDeckId);
  const isMounted = useMountedGuard();
  const [hasSaveError, setHasSaveError] = React.useState(false);
  const saveErrorToastId = React.useRef<ToastId | undefined>(undefined);
  const form = useForm<DeckCreateFormValues>({
    defaultValues: { name: "", category: "", convertToBr: false, localMode: false },
    resolver: zodResolver(deckFormSchema),
  });

  const dismissSaveError = () => dismissOwnedToast(saveErrorToastId);

  React.useEffect(() => () => dismissOwnedToast(saveErrorToastId), []);

  const submit = async (values: DeckCreateFormValues) => {
    dismissSaveError();
    setHasSaveError(false);
    try {
      const deck = {
        id: deckId,
        name: values.name,
        category: values.category,
        convertToBr: values.convertToBr,
      };
      await createDeck(uid, values.localMode ? { ...deck, localMode: true } : { ...deck, localMode: false });
      // A Deck write may finish after the user leaves this Page; prevent that stale completion from navigating them.
      if (isMounted()) {
        showToast({ message: `Created deck “${values.name}”.`, tone: "success" });
        onCreated(deckId);
      }
    } catch {
      if (isMounted()) {
        setHasSaveError(true);
        saveErrorToastId.current = showToast({ message: "Unable to create this deck. Try again.", tone: "error" });
      }
    }
  };
  const onFormSubmit = (event?: React.BaseSyntheticEvent) => {
    void form.handleSubmit(submit)(event);
  };

  // A retry must keep using react-hook-form's original persistence mode after a failed write.
  const isLocalModeLocked = form.formState.isSubmitting || hasSaveError;

  return {
    categories: CATEGORY,
    dismissSaveError,
    form,
    isDirty: form.formState.isDirty,
    isLocalModeLocked,
    onSubmit: onFormSubmit,
  };
};
