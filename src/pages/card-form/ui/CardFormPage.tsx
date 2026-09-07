import * as React from "react";
import { useFormState } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import { type Card, useCard } from "@/entities/card";
import { CATEGORY } from "@/entities/deck";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { routes, useNavigationGuard } from "@/shared/router";
import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

import { useCardFormPageModel } from "../model/useCardFormPageModel";
import type { CardFormValues } from "../model/types";
import { CardEditor } from "./CardEditor";

const CardFormContent: React.FC<{ card: Card }> = ({ card }) => {
  const navigate = useNavigate();
  // Keep one opening snapshot; subscription refreshes must not replace the draft.
  const [snapshot] = React.useState(card);
  const { form, submit } = useCardFormPageModel(snapshot);
  const { isDirty, isSubmitting } = useFormState({ control: form.control });
  const guard = useNavigationGuard(isDirty || isSubmitting);
  const isMounted = useMountedGuard();
  const cardListPath = routes.cardList.to(snapshot.deckId);

  const save = async (values: CardFormValues): Promise<void> => {
    if (!isMounted()) return;
    if (!(await submit(values))) return;
    if (!isMounted()) return;

    void guard.allowNavigation({ historyAction: "REPLACE", to: cardListPath }, () =>
      navigate(cardListPath, { replace: true })
    );
  };

  const pending: React.RefObject<boolean> = React.useRef(false);
  const handleSubmit = form.handleSubmit(save);
  const onSubmit: React.SubmitEventHandler<HTMLFormElement> = (event) => {
    if (pending.current) {
      // RHF must not start duplicate validation that could outlive the first save.
      event.preventDefault();
      return;
    }

    pending.current = true;
    void handleSubmit(event)
      .catch((error: unknown) => {
        // biome-ignore lint/suspicious/noConsole: Unexpected validation/callback errors need a runtime sink, not a persistence-failure toast.
        console.error("Card edit form callback failed.", error);
      })
      .finally(() => {
        pending.current = false;
      });
  };

  return (
    <AppLayout showHeader>
      {guard.element}
      <CardEditor
        cardInfo={{
          id: snapshot.id,
          uniqueKey: snapshot.uniqueKey,
          ...(snapshot.createdAt ? { createdAt: snapshot.createdAt } : {}),
          ...(snapshot.lastSeenAt != null ? { lastSeenAt: snapshot.lastSeenAt } : {}),
        }}
        categories={CATEGORY}
        form={form}
        onCancel={() => void navigate(-1)}
        onSubmit={onSubmit}
      />
    </AppLayout>
  );
};

export const CardFormPage: React.FC = () => {
  const { t } = useTranslation();
  const params = useParams();
  const cardId = params.id;
  if (cardId == null) throw new Error("invalid card id");
  const card = useCard(cardId);

  if (card == null) {
    return (
      <RouteNotFound title={t("cardForm.cardNotFound.title")} description={t("cardForm.cardNotFound.description")} />
    );
  }

  // Form state belongs to one route Card and must reset when the id changes.
  return <CardFormContent key={cardId} card={card} />;
};
