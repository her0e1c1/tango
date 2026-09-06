import type { Card } from "@/entities/card";

import type { CardFormValues } from "../cardFormSchema";

export const getCardFormValues = (card: Card): CardFormValues => ({
  frontText: card.frontText,
  backText: card.backText,
  tags: [...card.tags],
});
