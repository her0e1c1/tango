import { useForm } from "react-hook-form";

import type { Option } from "@/components/forms/Select";
import type { CardFormProps } from "@/features/card/components/CardForm";

export interface UseCardFormStateOptions {
  card: Card;
  categoryOptions: Option[];
  onSubmit?: (card: Card) => void | Promise<void>;
}

export const useCardFormState = ({ card, categoryOptions, onSubmit }: UseCardFormStateOptions): CardFormProps => {
  const { formState, handleSubmit, register } = useForm<Card>({ defaultValues: card });

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
    isSubmitting: formState.isSubmitting,
    onSubmit: handleSubmit((data) => onSubmit?.(data)),
  };
};
