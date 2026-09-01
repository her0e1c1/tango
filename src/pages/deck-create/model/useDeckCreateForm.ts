import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useAuthUid } from "@/entities/auth";
import { CATEGORY, createDeck, deckFormSchema, generateDeckId, type DeckId } from "@/entities/deck";
import type { DeckFormFields } from "@/features/deck-form";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { dismissToast, showToast, type ToastId } from "@/shared/ui/toast";

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
  const isMounted = useMountedGuard();
  const saveErrorToastId = React.useRef<ToastId | undefined>(undefined);
  const form = useForm<DeckFormFields>({
    defaultValues: { name: "", category: "", convertToBr: false, localMode: false },
    resolver: zodResolver(deckFormSchema),
  });

  const dismissSaveError = () => dismissOwnedToast(saveErrorToastId);

  React.useEffect(() => () => dismissOwnedToast(saveErrorToastId), []);

  const submit = async (values: DeckFormFields) => {
    dismissSaveError();
    const deckId = generateDeckId();
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
      if (isMounted()) {
        showToast({ message: `Created deck “${values.name}”.`, tone: "success" });
        onCreated(deckId);
      }
    } catch {
      if (isMounted()) {
        saveErrorToastId.current = showToast({ message: "Unable to create this deck.", tone: "error" });
      }
    }
  };
  const onFormSubmit = (event?: React.BaseSyntheticEvent) => {
    void form.handleSubmit(submit)(event);
  };

  return {
    categories: CATEGORY,
    dismissSaveError,
    form,
    isDirty: form.formState.isDirty,
    isLocalModeLocked: form.formState.isSubmitting,
    onSubmit: onFormSubmit,
  };
};
