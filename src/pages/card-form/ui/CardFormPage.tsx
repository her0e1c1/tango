import type * as React from "react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { type Card, useCard } from "@/entities/card";
import { CATEGORY } from "@/entities/deck";
import { useEditCard } from "@/features/card/edit";
import { useCardFormState } from "@/features/card/form";
import { useCardReadState } from "@/features/card/read";
import { Feedback } from "@/shared/ui/feedback";
import { RemoteReadBoundary } from "@/shared/ui/remote-read-boundary";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";

import { CardFormView } from "./CardFormView";

const CardFormContent = ({ card }: { card: Card }) => {
  const navigate = useNavigate();
  const mutations = useEditCard();
  const [mutationError, setMutationError] = useState<unknown>(null);
  const categoryOptions = CATEGORY.map((category) => ({ label: category, value: category }));
  const goBack = () => void navigate(-1);
  const cardForm = useCardFormState({
    card,
    categoryOptions,
    onSubmit: async (nextCard) => {
      setMutationError(null);
      try {
        await mutations.update(nextCard);
        goBack();
      } catch (error) {
        setMutationError(error);
      }
    },
  });

  return (
    <AppLayout showHeader>
      <CardFormView
        feedbackSlot={
          <Feedback tone="error">{mutationError == null ? null : "Unable to save changes. Try again."}</Feedback>
        }
        cardForm={{ ...cardForm, onCancel: goBack }}
      />
    </AppLayout>
  );
};

export const CardFormPage: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const cardId = params.id;
  if (cardId == null) throw Error("invalid card id");
  const card = useCard(cardId);
  const cardReadState = useCardReadState();

  return (
    <RemoteReadBoundary
      status={cardReadState.status}
      hasData={card != null}
      emptyContent={
        <RouteFeedback
          title="Card not found"
          description="The requested card is unavailable or has been removed."
          tone="not-found"
          primaryAction={{ label: "Go home", onClick: () => void navigate("/") }}
          secondaryAction={{ label: "Go back", onClick: () => void navigate(-1) }}
        />
      }
      onRetry={cardReadState.retry}
    >
      {card != null ? <CardFormContent card={card} /> : null}
    </RemoteReadBoundary>
  );
};
