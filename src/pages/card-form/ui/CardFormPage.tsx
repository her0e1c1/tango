import type * as React from "react";
import { useParams } from "react-router-dom";

import { type Card, useCard } from "@/entities/card";
import { CardEditForm, useCardEditAction, useCardFormState } from "@/features/card-edit";
import { routes, useNavigation } from "@/features/navigate";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";

const CardFormContent = ({ card }: { card: Card }) => {
  const navigation = useNavigation();
  const goBack = () => void navigation.back();
  const editAction = useCardEditAction({ onSaved: goBack });
  const form = useCardFormState({ card, onCancel: goBack, onSubmit: editAction.update });

  return (
    <AppLayout showHeader>
      <CardEditForm form={form} saveError={editAction.error} />
    </AppLayout>
  );
};

export const CardFormPage: React.FC = () => {
  const params = useParams();
  const navigation = useNavigation();
  const cardId = params.id;
  if (cardId == null) throw new Error("invalid card id");
  const card = useCard(cardId);

  if (card == null) {
    return (
      <RouteFeedback
        title="Card not found"
        description="The requested card is unavailable or has been removed."
        tone="not-found"
        primaryAction={{ label: "Go home", onClick: () => void navigation.to(routes.deckList.to()) }}
        secondaryAction={{ label: "Go back", onClick: () => void navigation.back() }}
      />
    );
  }

  return <CardFormContent card={card} />;
};
