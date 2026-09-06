import * as React from "react";
import type * as z from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { type Card, cardContentSchema } from "@/entities/card";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { dismissToast, type ToastId } from "@/shared/ui/toast";

const cardFormSchema = cardContentSchema.omit({ uniqueKey: true });
export type CardFormValues = z.infer<typeof cardFormSchema>;

const getCardFormValues = (card: Card): CardFormValues => ({
  frontText: card.frontText,
  backText: card.backText,
  tags: [...card.tags],
});

export const useCardFormState = (card: Card) => {
  const isMounted = useMountedGuard();
  // The edit form owns the snapshot it opened with; subscription refreshes do not merge into a user's draft.
  const [snapshot] = React.useState(card);
  const saveErrorToastId = React.useRef<ToastId | undefined>(undefined);
  const savingRef = React.useRef(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const form = useForm<CardFormValues>({
    defaultValues: getCardFormValues(snapshot),
    resolver: zodResolver(cardFormSchema),
  });

  React.useEffect(
    () => () => {
      if (saveErrorToastId.current !== undefined) dismissToast(saveErrorToastId.current);
    },
    []
  );
  return { snapshot, saveErrorToastId, savingRef, isSaving, setIsSaving, form, isMounted };
};
