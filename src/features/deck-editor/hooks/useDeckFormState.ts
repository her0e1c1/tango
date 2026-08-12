import type { Deck } from "@/entities/deck";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { DeckFormProps } from "../components/DeckForm";
import { deckFormSchema, type DeckFormValues } from "../lib/deckFormSchema";

interface DeckFormOption {
  label: string;
  value: string;
}

interface UseDeckFormStateOptions {
  deck: Deck;
  categoryOptions: DeckFormOption[];
  onCancel?: () => void;
  onSubmit?: (deck: Deck) => void | Promise<void>;
}

export const useDeckFormState = ({
  deck,
  categoryOptions,
  onCancel,
  onSubmit,
}: UseDeckFormStateOptions): DeckFormProps => {
  const { formState, handleSubmit, register } = useForm<DeckFormValues>({
    defaultValues: {
      name: deck.name,
      category: deck.category,
      url: deck.url,
      convertToBr: deck.convertToBr,
    },
    resolver: zodResolver(deckFormSchema),
  });

  return {
    deck,
    fields: {
      name: register("name"),
      convertToBr: register("convertToBr"),
      url: register("url"),
      category: {
        ...register("category"),
        options: categoryOptions,
      },
    },
    errors: {
      ...(formState.errors.name?.message !== undefined ? { name: formState.errors.name.message } : {}),
      ...(formState.errors.url?.message !== undefined ? { url: formState.errors.url.message } : {}),
    },
    isSubmitting: formState.isSubmitting,
    ...(onCancel !== undefined ? { onCancel } : {}),
    onSubmit: handleSubmit((values) => onSubmit?.({ ...deck, ...values, url: values.url ?? "" })),
  };
};
