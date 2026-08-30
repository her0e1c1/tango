import * as React from "react";
import type * as z from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useAuthUid } from "@/entities/auth";
import { cardContentSchema, createCard, generateCardId, type CardId } from "@/entities/card";
import { CATEGORY, type Deck } from "@/entities/deck";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";

const cardCreateFormSchema = cardContentSchema.omit({ uniqueKey: true });
export type CardCreateFormValues = z.infer<typeof cardCreateFormSchema>;

interface UseCardCreateFormOptions {
  deck: Deck;
  onCreated: (cardId: CardId) => void;
}

export const useCardCreateForm = ({ deck, onCreated }: UseCardCreateFormOptions) => {
  const uid = useAuthUid();
  // A failed response may hide a successful write, so every explicit retry must reuse this identity.
  const [cardId] = React.useState(generateCardId);
  const pending = React.useRef<boolean>(false);
  const isMounted = useMountedGuard();
  const [saveError, setSaveError] = React.useState<unknown>(null);
  const form = useForm<CardCreateFormValues>({
    defaultValues: { frontText: "", backText: "", tags: [] },
    resolver: zodResolver(cardCreateFormSchema),
  });

  const submit = form.handleSubmit(async (values) => {
    setSaveError(null);
    try {
      await createCard(uid, { id: cardId, uniqueKey: cardId, deckId: deck.id, ...values });
      // A Card write may finish after the user leaves this Page; stale completion must not navigate them.
      if (isMounted()) onCreated(cardId);
    } catch (error) {
      if (isMounted()) setSaveError(error);
    }
  });
  const onFormSubmit = (event?: Parameters<typeof submit>[0]) => {
    // React Hook Form exposes pending state to presentation, while this synchronous lock also closes the same-tick gap.
    // biome-ignore lint/suspicious/noUnnecessaryConditions: separate submit events observe mutations from earlier calls.
    if (pending.current) {
      event?.preventDefault();
      return;
    }
    pending.current = true;
    void submit(event).finally(() => {
      pending.current = false;
    });
  };

  return { categories: CATEGORY, deckName: deck.name, form, onSubmit: onFormSubmit, saveError };
};
