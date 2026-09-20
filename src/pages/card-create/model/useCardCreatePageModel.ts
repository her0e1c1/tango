import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFormState } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { getAuthUid } from "@/entities/auth";
import { type CardContentInput, cardContentInputSchema } from "@/entities/card";
import { routes, useNavigationGuard } from "@/shared/router";

import { submit as submitAction } from "./actions/submit";

export function useCardCreatePageModel(deckId: string) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const destination = routes.cardList.to(deckId);
  const form = useForm<CardContentInput>({
    defaultValues: { frontText: "", backText: "", tags: [] },
    resolver: zodResolver(cardContentInputSchema),
  });
  const { isDirty, isSubmitting } = useFormState({ control: form.control });
  const guard = useNavigationGuard(isDirty || isSubmitting, {
    description: isSubmitting ? t("cardForm.create.submittingDescription") : undefined,
  });

  async function onSubmit(values: CardContentInput): Promise<void> {
    if (await submitAction({ uid: getAuthUid(), deckId, values })) {
      void guard.allowNavigation({ historyAction: "REPLACE", to: destination }, () =>
        navigate(destination, { replace: true })
      );
    }
  }

  return {
    form,
    navigationGuard: guard.element,
    onCancel: () => void navigate(destination),
    onSubmit,
  };
}
