import type * as React from "react";
import { useNavigate, useParams } from "react-router-dom";

import { type Card, type CardEdit, useCard } from "@/entities/card";
import { CardEditForm } from "@/features/card-edit";
import { useCardReadState } from "@/features/card/read";
import { RemoteReadBoundary } from "@/shared/ui/remote-read-boundary";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";

type EditCard = (uid: string, card: CardEdit) => Promise<void>;

const CardFormContent = ({ card, editCard }: { card: Card; editCard: EditCard | undefined }) => {
  const navigate = useNavigate();
  const goBack = () => void navigate(-1);

  return (
    <AppLayout showHeader>
      <CardEditForm card={card} editCard={editCard} onSaved={goBack} onCancel={goBack} />
    </AppLayout>
  );
};

export const CardFormPage: React.FC<{ editCard?: EditCard }> = ({ editCard }) => {
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
    >
      {card != null ? <CardFormContent card={card} editCard={editCard} /> : null}
    </RemoteReadBoundary>
  );
};
