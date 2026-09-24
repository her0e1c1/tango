import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFormState } from "react-hook-form";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { type CardContentInput, cardContentInputSchema, useCard } from "@/entities/card";
import { useDeck } from "@/entities/deck";
import { usePreferences } from "@/entities/preference";
import { useCardPreviewContent } from "@/features/card-form";
import { routes, useNavigationGuard } from "@/shared/router";
import { showToast } from "@/shared/ui/toast";

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
  const [pending, setPending] = useState<{ id: string; name: string }>();
  const createdCard = useCard(pending?.id);
  const destination = routes.cardList.to(deckId);
  const form = useForm<CardContentInput>({
    defaultValues: { frontText: "", backText: "", tags: [] },
    resolver: zodResolver(cardContentInputSchema),
  });
  const { isDirty, isSubmitting } = useFormState({ control: form.control });
  const guard = useNavigationGuard(isDirty || isSubmitting || pending !== undefined, {
    description: isSubmitting ? t("cardForm.create.submittingDescription") : undefined,
  });

  async function onSubmit(values: CardContentInput): Promise<void> {
    if (pending !== undefined) return;
    const submitted = await submitAction({ deckId, values });
    if (submitted !== undefined) setPending(submitted);
  }

  useEffect(() => {
    if (pending === undefined || createdCard === undefined) return;
    showToast({ messageKey: "cardForm.toast.created", messageParams: { name: pending.name }, tone: "success" });
    setPending(undefined);
    void guard.allowNavigation({ historyAction: "REPLACE", to: destination }, () =>
      navigate(destination, { replace: true })
    );
  }, [createdCard, destination, guard, navigate, pending]);

  const preview = useCardPreviewContent(form.control, deck?.category ?? "", preferences.appearance.darkMode);

  return {
    form,
    preview,
    categories: deck?.tags ?? [],
    navigationGuard: guard.element,
    onCancel: () => void navigate(destination),
    pending: pending !== undefined,
    onSubmit: form.handleSubmit(onSubmit),
  };
}
