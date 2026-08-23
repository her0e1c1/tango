import * as React from "react";
import type * as z from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useAuthUid } from "@/entities/auth";
import { cardContentSchema, createCard, generateCardId, type CardId } from "@/entities/card";
import { CATEGORY, type Deck } from "@/entities/deck";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import type { Form, Option, Tag, Textarea } from "@/shared/ui/forms";

interface CardCreateTagField extends Option {
  input: React.ComponentProps<typeof Tag>;
}

export interface CardCreateFormProps {
  fields: {
    frontText: React.ComponentProps<typeof Textarea>;
    backText: React.ComponentProps<typeof Textarea>;
    tags: CardCreateTagField[];
  };
  errors: {
    frontText: string | undefined;
    backText: string | undefined;
  };
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: NonNullable<React.ComponentProps<typeof Form>["onSubmit"]>;
}

const cardCreateFormSchema = cardContentSchema.omit({ uniqueKey: true });
type CardCreateFormValues = z.infer<typeof cardCreateFormSchema>;

interface UseCardCreateStateOptions {
  deck: Deck;
  onCancel: () => void;
  onCreated: (cardId: CardId) => void;
}

export const useCardCreateState = ({ deck, onCancel, onCreated }: UseCardCreateStateOptions) => {
  const uid = useAuthUid();
  // Retries reuse one ID so an ambiguous write failure cannot create duplicate Cards.
  const [cardId] = React.useState(generateCardId);
  const isMounted = useMountedGuard();
  const [saveError, setSaveError] = React.useState<unknown>(null);
  const { formState, handleSubmit, register } = useForm<CardCreateFormValues>({
    defaultValues: { frontText: "", backText: "", tags: [] },
    resolver: zodResolver(cardCreateFormSchema),
  });

  const submit = handleSubmit(async (values) => {
    setSaveError(null);
    try {
      const card = {
        id: cardId,
        deckId: deck.id,
        uniqueKey: cardId,
        ...values,
      };
      await createCard(uid, deck.localMode ? card : { ...card, uid });
      // The write may finish after browser navigation unmounts this Page; never redirect from that stale completion.
      if (isMounted()) onCreated(cardId);
    } catch (error) {
      if (isMounted()) setSaveError(error);
    }
  });
  const onFormSubmit = (event?: Parameters<typeof submit>[0]) => {
    void submit(event);
  };

  const form: CardCreateFormProps = {
    fields: {
      frontText: register("frontText"),
      backText: register("backText"),
      tags: CATEGORY.map((category) => ({
        label: category,
        value: category,
        input: { ...register("tags"), value: category },
      })),
    },
    errors: {
      frontText: formState.errors.frontText?.message,
      backText: formState.errors.backText?.message,
    },
    isSubmitting: formState.isSubmitting,
    onCancel,
    onSubmit: onFormSubmit,
  };

  return { deckName: deck.name, form, saveError };
};
