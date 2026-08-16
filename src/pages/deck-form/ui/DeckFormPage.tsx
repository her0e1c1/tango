import type * as React from "react";
import { useParams } from "react-router-dom";

import { type Deck, useDeck } from "@/entities/deck";
import { DeckEditForm, useDeckEditAction, useDeckFormState } from "@/features/deck-edit";
import { routes, useNavigation } from "@/shared/routes";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";

const DeckFormContent = ({ deck }: { deck: Deck }) => {
  const navigation = useNavigation();
  const goToList = () => void navigation.to(routes.deckList.to(), { replace: true });
  const editAction = useDeckEditAction({ onSaved: goToList });
  const form = useDeckFormState({ deck, onCancel: goToList, onSubmit: editAction.update });

  return (
    <AppLayout showHeader>
      <DeckEditForm deckName={deck.name} form={form} saveError={editAction.error} />
    </AppLayout>
  );
};

export const DeckFormPage: React.FC = () => {
  const params = useParams();
  const navigation = useNavigation();
  const deckId = params.id;
  if (deckId == null) throw new Error("invalid deck id");
  const deck = useDeck(deckId);

  // Form state belongs to one route entity and must start fresh when navigation replaces the deck.
  if (deck != null) return <DeckFormContent key={deck.id} deck={deck} />;

  return (
    <RouteFeedback
      title="Deck not found"
      description="The requested deck is unavailable or has been removed."
      tone="not-found"
      primaryAction={{ label: "Go home", onClick: () => void navigation.to(routes.deckList.to()) }}
      secondaryAction={{ label: "Go back", onClick: () => void navigation.back() }}
    />
  );
};
