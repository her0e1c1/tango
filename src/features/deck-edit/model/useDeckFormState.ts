import type { Deck, DeckEdit } from "@/entities/deck";
import type * as z from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { CATEGORY, deckFormSchema } from "@/entities/deck";
import type { DeckFormProps } from "../ui/DeckForm";

type DeckFormValues = z.infer<typeof deckFormSchema>;

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
  const submit = handleSubmit((values) => onSubmit({ id: deck.id, ...values, url: values.url ?? null }));
  const onFormSubmit = (event?: Parameters<typeof submit>[0]) => {
    void submit(event);
  };

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
      name: formState.errors.name?.message,
      url: formState.errors.url?.message,
    },
    isSubmitting: formState.isSubmitting,
    onCancel,
    onSubmit: onFormSubmit,
  };
};
