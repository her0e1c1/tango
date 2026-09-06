import * as React from "react";
import type * as z from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { cardContentSchema, generateCardId } from "@/entities/card";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { dismissToast, type ToastId } from "@/shared/ui/toast";

const cardCreateFormSchema = cardContentSchema.omit({ uniqueKey: true });
export type CardCreateFormValues = z.infer<typeof cardCreateFormSchema>;

export const useCardCreateFormState = () => {
  // A failed response may hide a successful write, so every explicit retry must reuse this identity.
  const [cardId] = React.useState(generateCardId);
  const pending = React.useRef<boolean>(false);
  const isMounted = useMountedGuard();
  const saveErrorToastId = React.useRef<ToastId | undefined>(undefined);
  const form = useForm<CardCreateFormValues>({
    defaultValues: { frontText: "", backText: "", tags: [] },
    resolver: zodResolver(cardCreateFormSchema),
  });

  React.useEffect(
    () => () => {
      if (saveErrorToastId.current !== undefined) dismissToast(saveErrorToastId.current);
    },
    []
  );
  return { form, saveErrorToastId, isMounted, cardId, pending };
};
