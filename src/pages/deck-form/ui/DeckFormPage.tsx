import type * as React from "react";
import { useNavigate, useParams } from "react-router-dom";

import { type Deck, type DeckEdit, useDeck } from "@/entities/deck";
import { DeckEditForm } from "@/features/deck-edit";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";

type EditDeck = (uid: string, deck: DeckEdit) => Promise<void>;

const DeckFormContent = ({ deck, editDeck }: { deck: Deck; editDeck: EditDeck | undefined }) => {
  const navigate = useNavigate();
  const goToList = () => void navigate("/", { replace: true });

  return (
    <AppLayout showHeader>
      <DeckEditForm deck={deck} editDeck={editDeck} onSaved={goToList} onCancel={goToList} />
    </AppLayout>
  );
};

export const DeckFormPage: React.FC<{ editDeck?: EditDeck }> = ({ editDeck }) => {
  const params = useParams();
  const navigate = useNavigate();
  const deckId = params.id;
  if (deckId == null) throw Error("invalid deck id");
  const deck = useDeck(deckId);

  if (deck != null) return <DeckFormContent deck={deck} editDeck={editDeck} />;

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
