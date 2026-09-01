import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useAuthUid } from "@/entities/auth";
import { CATEGORY, type Deck, deckFormSchema, editDeck } from "@/entities/deck";
import type { DeckFormFields } from "@/features/deck-form";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { dismissToast, showToast, type ToastId } from "@/shared/ui/toast";

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

interface UseDeckFormOptions {
  deck: Deck;
  onSaved: () => void;
}

export const useDeckForm = ({ deck, onSaved }: UseDeckFormOptions) => {
  const uid = useAuthUid();
  const isMounted = useMountedGuard();
  // The edit form owns the snapshot it opened with; subscription refreshes do not merge into a user's draft.
  const [snapshot] = React.useState(deck);
  const saveErrorToastId = React.useRef<ToastId | undefined>(undefined);
  const savingRef = React.useRef(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const form = useForm<DeckFormFields>({
    defaultValues: getDeckFormValues(snapshot),
    resolver: zodResolver(deckFormSchema),
  });

  const dismissSaveError = () => {
    if (saveErrorToastId.current === undefined) return;
    dismissToast(saveErrorToastId.current);
    saveErrorToastId.current = undefined;
  };

  React.useEffect(() => () => dismissSaveError(), []);

  const submit = async (values: DeckFormFields) => {
    // biome-ignore lint/suspicious/noUnnecessaryConditions: React Hook Form can validate two same-tick submits before rerendering.
    if (savingRef.current) return;
    const savedInput = { ...values };
    savingRef.current = true;
    setIsSaving(true);
    dismissSaveError();
    try {
      await editDeck(uid, getDeckEditInput(snapshot, savedInput));
      if (isMounted()) {
        showToast({ message: `Updated deck “${savedInput.name}”.`, tone: "success" });
        onSaved();
      }
    } catch {
      if (isMounted()) {
        saveErrorToastId.current = showToast({ message: "Unable to save changes. Try again.", tone: "error" });
      }
    } finally {
      savingRef.current = false;
      if (isMounted()) setIsSaving(false);
    }
  };

  const onFormSubmit = (event?: React.BaseSyntheticEvent) => {
    void form.handleSubmit(submit)(event);
  };

  return {
    categories: CATEGORY,
    deckInfo: {
      id: snapshot.id,
      createdAt: snapshot.createdAt,
      updatedAt: snapshot.updatedAt,
    },
    deckName: snapshot.name,
    dismissSaveError,
    form,
    isDirty: form.formState.isDirty,
    isLocalOnly: snapshot.localMode,
    isSaving,
    onSubmit: onFormSubmit,
  };
};
