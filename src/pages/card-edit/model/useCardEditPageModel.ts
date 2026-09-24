import { useFormState } from "react-hook-form";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { type Card, useCard } from "@/entities/card";
import { useDeck } from "@/entities/deck";
import { usePreferences } from "@/entities/preference";
import { useCardPreviewContent } from "@/features/card-form";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { routes, useNavigationGuard } from "@/shared/router";
import { showToast } from "@/shared/ui/toast";

import { submit } from "./actions/submit";
import { getCardEditInfo } from "./queries/getCardEditInfo";
import { useCardEditFormState } from "./useCardEditFormState";

export function useCardEditRouteModel(cardId: string | undefined) {
  if (cardId == null) throw new Error("invalid card id");
  const card = useCard(cardId);
  return { cardId, card };
}

export function useCardEditPageModel(card: Card) {
  const { snapshot, form } = useCardEditFormState(card);
  const preferences = usePreferences();
  const deck = useDeck(snapshot.deckId);
  const navigate = useNavigate();
  const [pending, setPending] = useState<import("@/entities/card").CardContentInput>();
  const { isDirty, isSubmitting } = useFormState({ control: form.control });
  const guard = useNavigationGuard(isDirty || isSubmitting || pending !== undefined);
  const isMounted = useMountedGuard();
  const cardListPath = routes.cardList.to(snapshot.deckId);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!isMounted() || pending !== undefined) return;
    const submitted = await submit({ cardId: snapshot.id, values });
    if (submitted !== undefined && isMounted()) setPending(submitted);
  });
  useEffect(() => {
    if (
      pending === undefined ||
      card.frontText !== pending.frontText ||
      card.backText !== pending.backText ||
      card.tags.length !== pending.tags.length ||
      card.tags.some((tag, index) => tag !== pending.tags[index])
    )
      return;
    showToast({
      messageKey: "cardForm.toast.updated",
      messageParams: { name: pending.frontText },
      tone: "success",
    });
    void guard.allowNavigation({ historyAction: "REPLACE", to: cardListPath }, () =>
      navigate(cardListPath, { replace: true })
    );
  }, [card.backText, card.frontText, card.tags, cardListPath, guard, navigate, pending]);
  const preview = useCardPreviewContent(form.control, deck?.category ?? "", preferences.appearance.darkMode);

  return {
    form,
    preview,
    cardInfo: getCardEditInfo(snapshot),
    categories: deck?.tags ?? [],
    navigationGuard: guard.element,
    onCancel: () => void navigate(-1),
    pending: pending !== undefined,
    onSubmit,
  };
}
