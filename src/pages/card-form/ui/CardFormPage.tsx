import type * as React from "react";
import { useNavigate, useParams } from "react-router-dom";

import { type Card, useCard } from "@/entities/card";
import { CardEditForm } from "@/features/card-edit";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";

const CardFormContent = ({ card }: { card: Card }) => {
  const navigate = useNavigate();
  const goBack = () => void navigate(-1);

  return (
    <AppLayout showHeader>
      <CardEditForm card={card} onSaved={goBack} onCancel={goBack} />
    </AppLayout>
  );
};

export const CardFormPage: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const cardId = params.id;
  if (cardId == null) throw Error("invalid card id");
  const card = useCard(cardId);

  if (card != null) return <CardFormContent card={card} />;

  return (
    <RouteFeedback
      title="Card not found"
      description="The requested card is unavailable or has been removed."
      tone="not-found"
      primaryAction={{ label: "Go home", onClick: () => void navigate("/") }}
      secondaryAction={{ label: "Go back", onClick: () => void navigate(-1) }}
    />
  );
};
