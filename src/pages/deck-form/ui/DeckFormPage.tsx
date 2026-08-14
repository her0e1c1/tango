import type * as React from "react";
import { useNavigate, useParams } from "react-router-dom";

import { type Deck, useDeck } from "@/entities/deck";
import { DeckEditForm } from "@/features/deck-edit";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";

const DeckFormContent = ({ deck }: { deck: Deck }) => {
  const navigate = useNavigate();
  const goToList = () => void navigate("/", { replace: true });

  return (
    <AppLayout showHeader>
      <DeckEditForm deck={deck} onSaved={goToList} onCancel={goToList} />
    </AppLayout>
  );
};

export const DeckFormPage: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const deckId = params.id;
  if (deckId == null) throw Error("invalid deck id");
  const deck = useDeck(deckId);

  if (deck != null) return <DeckFormContent deck={deck} />;

  return (
    <RouteFeedback
      title="Deck not found"
      description="The requested deck is unavailable or has been removed."
      tone="not-found"
      primaryAction={{ label: "Go home", onClick: () => void navigate("/") }}
      secondaryAction={{ label: "Go back", onClick: () => void navigate(-1) }}
    />
  );
};
