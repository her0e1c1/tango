import type * as React from "react";
import { useNavigate } from "react-router-dom";

import { type Card, useCard } from "@/entities/card";
import { type StudyProgress, useStudyProgress } from "@/entities/study-progress";
import { CardEditForm } from "@/features/card-edit";
import { useRequiredRouteParam } from "@/shared/router";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";

const CardFormContent = ({ card, progress }: { card: Card; progress: StudyProgress }) => {
  const navigate = useNavigate();
  const goBack = () => void navigate(-1);

  return (
    <AppLayout showHeader>
      <CardEditForm card={card} progress={progress} onSaved={goBack} onCancel={goBack} />
    </AppLayout>
  );
};

export const CardFormPage: React.FC = () => {
  const navigate = useNavigate();
  const cardId = useRequiredRouteParam("id");
  const card = useCard(cardId);
  const progress = useStudyProgress(cardId);

  if (card == null) {
    return (
      <RouteFeedback
        title="Card not found"
        description="The requested card is unavailable or has been removed."
        tone="not-found"
        primaryAction={{ label: "Go home", onClick: () => void navigate("/") }}
        secondaryAction={{ label: "Go back", onClick: () => void navigate(-1) }}
      />
    );
  }

  if (progress == null) {
    return <RouteFeedback title="Loading card…" tone="loading" />;
  }

  return <CardFormContent card={card} progress={progress} />;
};
