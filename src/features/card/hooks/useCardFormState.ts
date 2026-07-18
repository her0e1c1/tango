import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { Option } from "@/components/forms/Select";
import type { CardFormProps } from "@/features/card/components/CardForm";
import { cardFormSchema, type CardFormValues } from "@/features/card/lib/cardFormSchema";

export interface UseCardFormStateOptions {
  card: Card;
  categoryOptions: Option[];
  onSubmit?: (card: Card) => void | Promise<void>;
}

export const useCardFormState = ({ card, categoryOptions, onSubmit }: UseCardFormStateOptions): CardFormProps => {
  const { formState, handleSubmit, register } = useForm<CardFormValues>({
    defaultValues: {
      frontText: card.frontText,
      backText: card.backText,
      tags: card.tags,
    },
    resolver: zodResolver(cardFormSchema),
  });

  return {
    card,
    fields: {
      frontText: register("frontText"),
      backText: register("backText"),
      tags: categoryOptions.map(({ label, value }) => ({
        label,
        value,
        input: { ...register("tags"), value },
      })),
    },
    errors: {
      frontText: formState.errors.frontText?.message,
      backText: formState.errors.backText?.message,
    },
    isSubmitting: formState.isSubmitting,
    onSubmit: handleSubmit((values) => onSubmit?.({ ...card, ...values })),
  };
};
