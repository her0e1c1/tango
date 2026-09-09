import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { type Deck, deckFormSchema } from "@/entities/deck";
import type { DeckFormFields } from "@/features/deck-form";

import { submit as submitAction } from "./actions/submit";

export function useDeckFormPageModel(deck: Deck) {
  const form = useForm<DeckFormFields>({
    defaultValues: {
      name: deck.name,
      category: deck.category,
      url: deck.url || undefined,
      convertToBr: deck.convertToBr,
      localMode: deck.localMode,
    },
    resolver: zodResolver(deckFormSchema),
  });

  return {
    form,
    submit: (values: DeckFormFields) => submitAction({ deck, values }),
  };
}
