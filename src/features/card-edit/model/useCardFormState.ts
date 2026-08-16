import type * as z from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { cardContentSchema, type Card, type CardEditInput } from "@/entities/card";
import { CATEGORY } from "@/entities/deck";
import type { CardFormProps } from "../ui/CardForm";

const cardFormSchema = cardContentSchema.omit({ uniqueKey: true });
type CardFormValues = z.infer<typeof cardFormSchema>;

interface UseCardFormStateOptions {
  card: Card;
  onCancel: () => void;
  onSubmit: (card: CardEditInput) => Promise<void>;
}

export const useCardFormState = ({ card, onCancel, onSubmit }: UseCardFormStateOptions): CardFormProps => {
  const { formState, handleSubmit, register } = useForm<CardFormValues>({
    defaultValues: {
      frontText: card.frontText,
      backText: card.backText,
      tags: card.tags,
    },
    resolver: zodResolver(cardFormSchema),
  });
  const submit = handleSubmit((values) => onSubmit({ id: card.id, ...values }));
  const onFormSubmit = (event?: Parameters<typeof submit>[0]) => {
    void submit(event);
  };

  return {
    cardInfo: {
      id: card.id,
      uniqueKey: card.uniqueKey,
      ...(card.createdAt ? { createdAt: new Date(card.createdAt).toLocaleDateString() } : {}),
      ...(card.lastSeenAt != null ? { lastSeenAt: new Date(card.lastSeenAt).toLocaleDateString() } : {}),
    },
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
};
