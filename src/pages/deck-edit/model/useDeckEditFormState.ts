import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";

import { type Deck, deckFormSchema } from "@/entities/deck";
import type { DeckFormFields } from "@/features/deck-form";

import type { PendingDeckSave } from "./actions/submitDeckEdit";

export interface DeckEditFormFields extends DeckFormFields {
  // A removed tag keeps its slot so later additions cannot be mistaken for renames.
  tags?: (string | null)[] | undefined;
}

const deckEditFormSchema = deckFormSchema.extend({ tags: z.array(z.string().nullable()).optional() });

export function useDeckEditFormState(deck: Deck, managedTags: string[]) {
  const form = useForm<DeckEditFormFields>({
    defaultValues: {
      tags: managedTags,
      name: deck.name,
      category: deck.category,
      url: deck.url || undefined,
      convertToBr: deck.convertToBr,
    },
    resolver: zodResolver(deckEditFormSchema),
  });

  const [pendingSave, setPendingSave] = useState<PendingDeckSave | undefined>(undefined);
  form.register("tags");
  useEffect(() => {
    // Follow subscriptions until the user changes tags; keep the original slots after editing starts.
    if (!form.getFieldState("tags").isDirty && JSON.stringify(form.getValues("tags")) !== JSON.stringify(managedTags)) {
      form.resetField("tags", { defaultValue: managedTags });
    }
  }, [form, managedTags]);

  return { form, pendingSave, setPendingSave };
}
