import { useForm } from "react-hook-form";

import { renameKey } from "@src/shared/forms/renameKey";
import type { Option } from "@src/shared/components/Select";
import type { CardFormProps } from "@src/features/card/components/CardForm";

export interface UseCardFormStateOptions {
  card: Card;
  categoryOptions: Option[];
  onSubmit?: (card: Card) => void;
}

export const useCardFormState = ({ card, categoryOptions, onSubmit }: UseCardFormStateOptions): CardFormProps => {
  const { formState, handleSubmit, register } = useForm<Card>({ defaultValues: card });

  return {
    card,
    fields: {
      frontText: renameKey(register("frontText")),
      backText: renameKey(register("backText")),
      tags: categoryOptions.map(({ label, value }) => ({
        label,
        value,
        input: { ...renameKey(register("tags")), value },
      })),
    },
    isSubmitting: formState.isSubmitting,
    onSubmit: handleSubmit((data) => onSubmit?.(data)),
  };
};
