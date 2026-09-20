import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { getAuthUid } from "@/entities/auth";
import { type CardContentInput, cardContentInputSchema } from "@/entities/card";
import { useCardPreviewContent } from "@/features/card-form";
import { useDeck } from "@/entities/deck";
import { usePreferences } from "@/entities/preference";

import { submit as submitAction } from "./actions/submit";

export function useCardCreatePageModel(deckId: string) {
  const deck = useDeck(deckId);
  const preferences = usePreferences();
  const form = useForm<CardContentInput>({
    defaultValues: { frontText: "", backText: "", tags: [] },
    resolver: zodResolver(cardContentInputSchema),
  });

  const preview = useCardPreviewContent(form.control, deck?.category ?? "", preferences.appearance.darkMode);

  return {
    form,
    preview,
    submit: (values: CardContentInput) => submitAction({ uid: getAuthUid(), deckId, values }),
  };
}
