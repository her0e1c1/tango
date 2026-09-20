import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { type Card, type CardContentInput, cardContentInputSchema } from "@/entities/card";

export function useCardEditFormState(card: Card) {
  // Subscription refreshes must not replace the opening snapshot or the draft.
  const [snapshot] = useState(card);
  const form = useForm<CardContentInput>({
    defaultValues: {
      frontText: snapshot.frontText,
      backText: snapshot.backText,
      tags: [...snapshot.tags],
    },
    resolver: zodResolver(cardContentInputSchema),
  });
  return { snapshot, form };
}
