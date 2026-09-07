import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { type Card, type CardContentInput, cardContentInputSchema } from "@/entities/card";

import { submit as submitAction } from "./actions/submit";

export function useCardFormPageModel(card: Card) {
  const form = useForm<CardContentInput>({
    defaultValues: {
      frontText: card.frontText,
      backText: card.backText,
      tags: [...card.tags],
    },
    resolver: zodResolver(cardContentInputSchema),
  });

  return {
    form,
    submit: (values: CardContentInput) => submitAction({ cardId: card.id, values }),
  };
}
