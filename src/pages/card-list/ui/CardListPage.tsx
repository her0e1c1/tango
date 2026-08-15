import type * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useKey } from "react-use";

import { type CardId, useCardsByDeckId } from "@/entities/card";
import { type Deck, useDeck } from "@/entities/deck";
import { type Preferences, usePreferences } from "@/entities/preferences";
import type { StudyCard } from "@/entities/study-progress";
import { CardList, useEditCardScore } from "@/features/card-list";
import { BackText } from "@/features/card-view";
import { DeckFilterForm, useDeckFilterState, useFilteredStudyCards } from "@/features/deck-filter";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";

const CardListComposition = (props: {
  deck: Deck;
  cards: StudyCard[];
  tags: string[];
  preferences: Preferences;
  onEditCard: (id: CardId) => void;
}) => {
  const deckFilterForm = useDeckFilterState({ deck: props.deck, tags: props.tags });
  const editCardScore = useEditCardScore();

  return (
    <CardList
      deck={props.deck}
      cards={props.cards}
      preferences={props.preferences}
      filter={{
        scoreMax: deckFilterForm.scoreMax,
        scoreMin: deckFilterForm.scoreMin,
        selectedTags: deckFilterForm.tagFilterProps.selectedTags ?? [],
        controls: <DeckFilterForm {...deckFilterForm} />,
        onChangeSelectedTags: (selectedTags) => deckFilterForm.tagFilterProps.onClickTag?.(selectedTags),
      }}
      renderBackText={(backText) => <BackText {...backText} />}
      onEditCard={props.onEditCard}
      onChangeScore={(progress, score) => editCardScore.updateScore(progress.cardId, score)}
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
  const cards = useFilteredStudyCards(deck, deckCards, preferences);

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
