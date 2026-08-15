import type { Deck, DeckEdit } from "@/entities/deck";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { CATEGORY } from "@/entities/deck";
import type { DeckFormProps } from "../ui/DeckForm";
import { deckFormSchema, type DeckFormValues } from "./deckFormSchema";

interface UseDeckFormStateOptions {
  deck: Deck;
  onCancel: () => void;
  onSubmit: (deck: DeckEdit) => Promise<void>;
}

export const useDeckFormState = ({ deck, onCancel, onSubmit }: UseDeckFormStateOptions): DeckFormProps => {
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
      // Keep optional Deck URLs absent even though an empty HTML input reports an empty string.
      url: register("url", { setValueAs: (value: unknown) => (value === "" ? undefined : value) }),
      category: {
        ...register("category"),
        options: CATEGORY.map((category) => ({ label: category, value: category })),
      },
    },
    errors: {
      ...(formState.errors.name?.message !== undefined ? { name: formState.errors.name.message } : {}),
      ...(formState.errors.url?.message !== undefined ? { url: formState.errors.url.message } : {}),
    },
    isSubmitting: formState.isSubmitting,
    onCancel,
    onSubmit: handleSubmit((values) => onSubmit({ id: deck.id, ...values })),
  };
};
