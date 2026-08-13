import type * as React from "react";
import { useNavigate, useParams } from "react-router-dom";

import { type Card, useCards } from "@/entities/card";
import { CATEGORY } from "@/entities/deck";
import { useCardFormState, useCardMutations } from "@/features/card";
import { RemoteMutationNotice } from "@/shared/ui/remote-mutation-notice";
import { RemoteReadBoundary } from "@/shared/ui/remote-read-boundary";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";

import { CardFormView } from "./CardFormView";

const CardFormContent = ({ card }: { card: Card }) => {
  const navigate = useNavigate();
  const mutations = useCardMutations();
  const categoryOptions = CATEGORY.map((category) => ({ label: category, value: category }));
  const goBack = () => void navigate(-1);
  const cardForm = useCardFormState({
    card,
    categoryOptions,
    onSubmit: async (nextCard) => {
      try {
        await mutations.update(nextCard);
        goBack();
      } catch {
        // The mutation notice owns error feedback and retry.
      }
    },
  });

  return (
    <AppLayout showHeader>
      <CardFormView
        feedbackSlot={
          <RemoteMutationNotice pending={mutations.pending} error={mutations.error} onRetry={mutations.retry} />
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
  const remote = useCards();
  const card = remote.cardsById[cardId];

  return (
    <RemoteReadBoundary
      status={remote.status}
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
      onRetry={remote.retry}
    >
      {card != null ? <CardFormContent card={card} /> : null}
    </RemoteReadBoundary>
  );
};
