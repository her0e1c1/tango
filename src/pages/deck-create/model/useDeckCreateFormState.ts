import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { deckFormSchema } from "@/entities/deck";
import type { DeckFormFields } from "@/features/deck-form";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { dismissToast, type ToastId } from "@/shared/ui/toast";

export const useDeckCreateFormState = () => {
  const isMounted = useMountedGuard();
  const saveErrorToastId = React.useRef<ToastId | undefined>(undefined);
  const form = useForm<DeckFormFields>({
    defaultValues: { name: "", category: "", convertToBr: false, localMode: false },
    resolver: zodResolver(deckFormSchema),
  });

  React.useEffect(
    () => () => {
      if (saveErrorToastId.current !== undefined) dismissToast(saveErrorToastId.current);
    },
    []
  );
  return { form, saveErrorToastId, isMounted };
};
