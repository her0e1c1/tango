import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";

import { type Deck, deckFormSchema } from "@/entities/deck";
import type { DeckFormFields } from "@/features/deck-form";

export interface DeckEditFormFields extends DeckFormFields {
  tags?: string[] | undefined;
}

const deckEditFormSchema = deckFormSchema.extend({ tags: z.array(z.string()).optional() });

export function useDeckEditFormState(deck: Deck) {
  const form = useForm<DeckEditFormFields>({
    defaultValues: {
      name: deck.name,
      category: deck.category,
      url: deck.url || undefined,
      convertToBr: deck.convertToBr,
    },
    resolver: zodResolver(deckEditFormSchema),
  });

  return { form };
}
