import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { getAuthUid } from "@/entities/auth";
import { type CardContentInput, cardContentInputSchema } from "@/entities/card";

import { submitCardCreation } from "./actions/submitCardCreation";

export function useCardCreatePageModel(deckId: string) {
  const form = useForm<CardContentInput>({
    defaultValues: { frontText: "", backText: "", tags: [] },
    resolver: zodResolver(cardContentInputSchema),
  });

  return {
    form,
    submit: (values: CardContentInput) => submitCardCreation({ uid: getAuthUid(), deckId, values }),
  };
}
