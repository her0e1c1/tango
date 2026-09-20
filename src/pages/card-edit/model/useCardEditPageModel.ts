import { useFormState } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { type Card, useCard } from "@/entities/card";
import { CATEGORY, useDeck } from "@/entities/deck";
import { usePreferences } from "@/entities/preference";
import { useCardPreviewContent } from "@/features/card-form";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { useResetStoreOnMount } from "@/shared/lib/useResetStoreOnMount";
import { routes, useNavigationGuard } from "@/shared/router";

import { submit } from "./actions/submit";
import { cardEditPageStore } from "./store";
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
  const { isDirty, isSubmitting } = useFormState({ control: form.control });
  const guard = useNavigationGuard(isDirty || isSubmitting);
  const isMounted = useMountedGuard();
  useResetStoreOnMount(cardEditPageStore);
  const cardListPath = routes.cardList.to(snapshot.deckId);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!isMounted()) return;
    if (!(await submit({ cardId: snapshot.id, values }))) return;
    if (!isMounted()) return;

    void guard.allowNavigation({ historyAction: "REPLACE", to: cardListPath }, () =>
      navigate(cardListPath, { replace: true })
    );
  });
  const preview = useCardPreviewContent(form.control, deck?.category ?? "", preferences.appearance.darkMode);

  return {
    form,
    preview,
    cardInfo: getCardEditInfo(snapshot),
    categories: CATEGORY,
    navigationGuard: guard.element,
    onCancel: () => void navigate(-1),
    onSubmit,
  };
}
