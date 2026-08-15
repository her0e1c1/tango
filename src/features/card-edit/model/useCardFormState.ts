import type { Card, CardEditInput } from "@/entities/card";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { Option } from "@/shared/ui/forms";
import type { CardFormProps } from "../ui/CardForm";
import { cardFormSchema, type CardFormValues } from "./cardFormSchema";

interface UseCardFormStateOptions {
  card: Card;
  categoryOptions: Option[];
  onCancel: () => void;
  onSubmit: (card: CardEditInput) => Promise<void>;
}

export const useCardFormState = ({
  card,
  categoryOptions,
  onCancel,
  onSubmit,
}: UseCardFormStateOptions): Omit<CardFormProps, "progress"> => {
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
      ...(formState.errors.frontText?.message !== undefined ? { frontText: formState.errors.frontText.message } : {}),
      ...(formState.errors.backText?.message !== undefined ? { backText: formState.errors.backText.message } : {}),
    },
    isSubmitting: formState.isSubmitting,
    onCancel,
    onSubmit: handleSubmit((values) => onSubmit({ id: card.id, ...values })),
  };
};
