import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { deckFormSchema } from "@/entities/deck";
import type { DeckFormFields } from "@/features/deck-form";

export const useDeckCreateFormState = () => {
  const form = useForm<DeckFormFields>({
    defaultValues: { name: "", category: "", convertToBr: false },
    resolver: zodResolver(deckFormSchema),
  });
  return { form };
};
