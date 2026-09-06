import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useAuthUid } from "@/entities/auth";

import { submit as submitAction } from "./actions/submit";
import { cardCreateFormSchema } from "./schema";
import type { CardCreateFormValues } from "./types";

export function useCardCreatePageModel(deckId: string) {
  const uid = useAuthUid();
  const form = useForm<CardCreateFormValues>({
    defaultValues: { frontText: "", backText: "", tags: [] },
    resolver: zodResolver(cardCreateFormSchema),
  });

  return {
    form,
    submit: (values: CardCreateFormValues) => submitAction({ uid, deckId, values }),
  };
}
