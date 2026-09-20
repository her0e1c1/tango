import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFormState } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { getAuthUid } from "@/entities/auth";
import { type CardContentInput, cardContentInputSchema } from "@/entities/card";
import { CATEGORY, useDeck } from "@/entities/deck";
import { usePreferences } from "@/entities/preference";
import { useCardPreviewContent } from "@/features/card-form";
import { routes, useNavigationGuard } from "@/shared/router";

import { submit as submitAction } from "./actions/submit";

export function useCardCreateRouteModel(deckId: string | undefined) {
  if (deckId === undefined) throw new Error("invalid deck id");
  const deck = useDeck(deckId);
  return { deckId, deck };
}

export function useCardCreatePageModel(deckId: string) {
  const deck = useDeck(deckId);
  const preferences = usePreferences();
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

  const preview = useCardPreviewContent(form.control, deck?.category ?? "", preferences.appearance.darkMode);

  return {
    form,
    preview,
    categories: CATEGORY,
    navigationGuard: guard.element,
    onCancel: () => void navigate(destination),
    onSubmit: form.handleSubmit(onSubmit),
  };
}
