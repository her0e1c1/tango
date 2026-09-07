import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { Card } from "@/entities/card";

import { submit as submitAction } from "./actions/submit";
import { cardFormSchema } from "./schema";
import type { CardFormValues } from "./types";

export function useCardFormPageModel(card: Card) {
  const form = useForm<CardFormValues>({
    defaultValues: {
      frontText: card.frontText,
      backText: card.backText,
      tags: [...card.tags],
    },
    resolver: zodResolver(cardFormSchema),
  });

  return {
    form,
    submit: (values: CardFormValues) => submitAction({ cardId: card.id, values }),
  };
}
