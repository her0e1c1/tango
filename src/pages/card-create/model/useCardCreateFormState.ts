import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { generateCardId } from "@/entities/card";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import type { ToastId } from "@/shared/ui/toast";

import { dismissSaveError } from "./actions/dismissSaveError";
import { cardCreateFormSchema, type CardCreateFormValues } from "./schema";

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

  React.useEffect(() => () => dismissSaveError(saveErrorToastId), []);
  return { form, saveErrorToastId, isMounted, cardId, pending };
};
