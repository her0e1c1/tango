import type * as React from "react";
import { useNavigate } from "react-router-dom";

import { type Card, useCard } from "@/entities/card";
import { CardEditForm } from "@/features/card-edit";
import { discardPromise } from "@/shared/lib/discardPromise";
import { useRequiredRouteParam } from "@/shared/router";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";

const CardFormContent = ({ card }: { card: Card }) => {
  const navigate = useNavigate();
  const goBack = () => {
    discardPromise(navigate(-1));
  };

  return (
    <AppLayout showHeader>
      <CardEditForm card={card} onSaved={goBack} onCancel={goBack} />
    </AppLayout>
  );
};

export const CardFormPage: React.FC = () => {
  const navigate = useNavigate();
  const cardId = useRequiredRouteParam("id");
  const card = useCard(cardId);

  if (card == null) {
    return (
      <RouteFeedback
        title="Card not found"
        description="The requested card is unavailable or has been removed."
        tone="not-found"
        primaryAction={{
          label: "Go home",
          onClick: () => {
            discardPromise(navigate("/"));
          },
        }}
        secondaryAction={{
          label: "Go back",
          onClick: () => {
            discardPromise(navigate(-1));
          },
        }}
      />
    );
  }

  return <CardFormContent card={card} />;
};
