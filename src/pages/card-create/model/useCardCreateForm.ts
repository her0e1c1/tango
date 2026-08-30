import * as React from "react";
import type * as z from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useAuthUid } from "@/entities/auth";
import { cardContentSchema, createCard, generateCardId, type CardId } from "@/entities/card";
import { CATEGORY, type Deck } from "@/entities/deck";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { dismissToast, showToast, type ToastId } from "@/shared/ui/toast";

const cardCreateFormSchema = cardContentSchema.omit({ uniqueKey: true });
export type CardCreateFormValues = z.infer<typeof cardCreateFormSchema>;

interface UseCardCreateFormOptions {
  deck: Deck;
  onCreated: (cardId: CardId) => void;
}

const dismissOwnedToast = (toastId: React.RefObject<ToastId | undefined>) => {
  const id = toastId.current;
  if (id === undefined) return;
  dismissToast(id);
  toastId.current = undefined;
};

export const useCardCreateForm = ({ deck, onCreated }: UseCardCreateFormOptions) => {
  const uid = useAuthUid();
  // A failed response may hide a successful write, so every explicit retry must reuse this identity.
  const [cardId] = React.useState(generateCardId);
  const pending = React.useRef<boolean>(false);
  const isMounted = useMountedGuard();
  const saveErrorToastId = React.useRef<ToastId | undefined>(undefined);
  const form = useForm<CardCreateFormValues>({
    defaultValues: { frontText: "", backText: "", tags: [] },
    resolver: zodResolver(cardCreateFormSchema),
  });

  const dismissSaveError = () => dismissOwnedToast(saveErrorToastId);

  React.useEffect(() => () => dismissOwnedToast(saveErrorToastId), []);

  const submit = async (values: CardCreateFormValues) => {
    dismissSaveError();
    try {
      await createCard(uid, { id: cardId, uniqueKey: cardId, deckId: deck.id, ...values });
      // A Card write may finish after the user leaves this Page; stale completion must not navigate them.
      if (isMounted()) {
        showToast({ message: `Created card “${values.frontText}”.`, tone: "success" });
        onCreated(cardId);
      }
    } catch {
      if (isMounted()) {
        saveErrorToastId.current = showToast({ message: "Unable to create this card. Try again.", tone: "error" });
      }
    }
  };
  const onFormSubmit = (event?: React.BaseSyntheticEvent) => {
    // React Hook Form exposes pending state to presentation, while this synchronous lock also closes the same-tick gap.
    // biome-ignore lint/suspicious/noUnnecessaryConditions: separate submit events observe mutations from earlier calls.
    if (pending.current) {
      event?.preventDefault();
      return;
    }
    pending.current = true;
    void form
      .handleSubmit(submit)(event)
      .finally(() => {
        pending.current = false;
      });
  };

  return { categories: CATEGORY, deckName: deck.name, dismissSaveError, form, onSubmit: onFormSubmit };
};
