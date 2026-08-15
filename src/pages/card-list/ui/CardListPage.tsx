import type * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useKey } from "react-use";

import { useDeck } from "@/entities/deck";
import { CardListContainer } from "@/features/card-list";
import { BackText } from "@/features/card-view";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";

export const CardListPage: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const deckId = params.id;
  if (deckId == null) throw Error("invalid deck id");
  const deck = useDeck(deckId);

  useKey("t", () => void navigate("/"));
  useKey("s", () => void navigate("/settings"));

  if (deck == null) {
    return (
      <RouteFeedback
        title="Deck not found"
        description="The requested deck is unavailable or has been removed."
        tone="not-found"
        primaryAction={{ label: "Go home", onClick: () => void navigate("/") }}
        secondaryAction={{ label: "Go back", onClick: () => void navigate(-1) }}
      />
    );
  }

  return (
    <AppLayout showHeader>
      <CardListContainer
        deck={deck}
        renderBackText={(backText) => <BackText {...backText} />}
        onEditCard={(id) => void navigate(`/card/${id}/edit`)}
      />
    </AppLayout>
  );
};
