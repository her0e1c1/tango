import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useAuthUid } from "@/entities/auth";
import { type CardContentInput, cardContentInputSchema } from "@/entities/card";

import { submit as submitAction } from "./actions/submit";

export function useCardCreatePageModel(deckId: string) {
  const uid = useAuthUid();
  const form = useForm<CardContentInput>({
    defaultValues: { frontText: "", backText: "", tags: [] },
    resolver: zodResolver(cardContentInputSchema),
  });

  return {
    form,
    submit: (values: CardContentInput) => submitAction({ uid, deckId, values }),
  };
}
