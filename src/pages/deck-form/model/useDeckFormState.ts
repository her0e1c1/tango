import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { type Deck, deckFormSchema } from "@/entities/deck";
import type { DeckFormFields } from "@/features/deck-form";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { dismissToast, type ToastId } from "@/shared/ui/toast";

const getDeckFormValues = (deck: Deck): DeckFormFields => ({
  name: deck.name,
  category: deck.category,
  url: deck.url || undefined,
  convertToBr: deck.convertToBr,
  localMode: deck.localMode,
});

export const useDeckFormState = (deck: Deck) => {
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

  React.useEffect(
    () => () => {
      if (saveErrorToastId.current !== undefined) dismissToast(saveErrorToastId.current);
    },
    []
  );
  return { snapshot, saveErrorToastId, savingRef, isSaving, setIsSaving, form, isMounted };
};
