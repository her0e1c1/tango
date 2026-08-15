import type * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useKey } from "react-use";

import { type Card, type CardId, useCardsByDeckId } from "@/entities/card";
import { type Deck, useDeck } from "@/entities/deck";
import { type Preferences, usePreferences } from "@/entities/preferences";
import { CardList } from "@/features/card-list";
import { BackText } from "@/features/card-view";
import { DeckStartForm, useDeckFilterState } from "@/features/deck-start";
import { useEditStudyProgress, useStudyCards } from "@/features/study";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";

const CardListComposition = (props: {
  deck: Deck;
  cards: Card[];
  tags: string[];
  preferences: Preferences;
  onEditCard: (id: CardId) => void;
}) => {
  const deckStartForm = useDeckFilterState({ deck: props.deck, tags: props.tags });
  const editMutation = useEditStudyProgress();

  return (
    <CardList
      deck={props.deck}
      cards={props.cards}
      preferences={props.preferences}
      filter={{
        scoreMax: deckStartForm.scoreMax,
        scoreMin: deckStartForm.scoreMin,
        selectedTags: deckStartForm.tagFilterProps.selectedTags ?? [],
        controls: <DeckStartForm {...deckStartForm} />,
        onChangeSelectedTags: (selectedTags) => deckStartForm.tagFilterProps.onClickTag?.(selectedTags),
      }}
      renderBackText={(backText) => <BackText {...backText} />}
      onEditCard={props.onEditCard}
      onChangeScore={(card, score) => editMutation.updateBy(card, () => ({ score }))}
    />
  );
};

export const CardListPage: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const deckId = params.id;
  if (deckId == null) throw Error("invalid deck id");
  const preferences = usePreferences();
  const deck = useDeck(deckId);
  const { cards: deckCards, tags } = useCardsByDeckId(deckId);
  const cards = useStudyCards(deck, deckCards, preferences);

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
      <CardListComposition
        deck={deck}
        cards={cards}
        tags={tags}
        preferences={preferences}
        onEditCard={(id) => void navigate(`/card/${id}/edit`)}
      />
    </AppLayout>
  );
};
