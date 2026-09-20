import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { type Card, type CardContentInput, cardContentInputSchema } from "@/entities/card";
import { useCardPreviewContent } from "@/features/card-form";
import { usePreferences } from "@/entities/preference";
import { useDeck } from "@/entities/deck";

import { submit as submitAction } from "./actions/submit";

export function useCardEditPageModel(card: Card) {
  const preferences = usePreferences();
  const deck = useDeck(card.deckId);
  const form = useForm<CardContentInput>({
    defaultValues: {
      frontText: card.frontText,
      backText: card.backText,
      tags: [...card.tags],
    },
    resolver: zodResolver(cardContentInputSchema),
  });

  const preview = useCardPreviewContent(form.control, deck?.category ?? "", preferences.appearance.darkMode);

  return {
    form,
    preview,
    submit: (values: CardContentInput) => submitAction({ cardId: card.id, values }),
  };
}
