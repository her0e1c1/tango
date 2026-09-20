import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { deckFormSchema } from "@/entities/deck";
import type { DeckFormFields } from "@/features/deck-form";

export const useDeckCreateFormState = (isAnonymous: boolean) => {
  const form = useForm<DeckFormFields>({
    defaultValues: { name: "", category: "", convertToBr: false, localMode: isAnonymous },
    resolver: zodResolver(deckFormSchema),
  });
  return { form };
};
