import type * as React from "react";
import { useParams } from "react-router-dom";

import { type Deck, useDeck } from "@/entities/deck";
import { DeckEditForm } from "@/features/deck-edit";
import { useNavigation } from "@/shared/routes";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";

const DeckFormContent = ({ deck }: { deck: Deck }) => {
  const navigation = useNavigation();
  const goToList = () => void navigation.goToDeckList({ replace: true });

  return (
    <AppLayout showHeader>
      <DeckEditForm deck={deck} onSaved={goToList} onCancel={goToList} />
    </AppLayout>
  );
};

export const DeckFormPage: React.FC = () => {
  const params = useParams();
  const navigation = useNavigation();
  const deckId = params.id;
  if (deckId == null) throw new Error("invalid deck id");
  const deck = useDeck(deckId);

  if (deck != null) return <DeckFormContent deck={deck} />;

  return (
    <RouteFeedback
      title="Deck not found"
      description="The requested deck is unavailable or has been removed."
      tone="not-found"
      primaryAction={{ label: "Go home", onClick: () => void navigation.goToDeckList() }}
      secondaryAction={{ label: "Go back", onClick: () => void navigation.goBack() }}
    />
  );
};
