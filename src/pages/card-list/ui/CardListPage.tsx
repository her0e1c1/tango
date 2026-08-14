import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useKey } from "react-use";

import { filterCardsByDeckId, filterTagsByDeckId, type Card, type CardId, useCards } from "@/entities/card";
import { type Deck, useDeck } from "@/entities/deck";
import { type Preferences, usePreferences } from "@/entities/preferences";
import { useCardReadState } from "@/features/card/read";
import { CardList } from "@/features/card-list";
import { BackText } from "@/features/card-view";
import { DeckStartForm, useDeckFilterState, useEditStudyProgress, useStudyCards } from "@/features/study";
import { RemoteReadBoundary } from "@/shared/ui/remote-read-boundary";
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
  const allCards = useCards();
  const cardReadState = useCardReadState();
  const deck = useDeck(deckId);
  const deckCards = React.useMemo(() => filterCardsByDeckId(allCards, deckId), [allCards, deckId]);
  const cards = useStudyCards(deck, deckCards, preferences);
  const tags = filterTagsByDeckId(allCards, deckId);

  useKey("t", () => void navigate("/"));
  useKey("s", () => void navigate("/settings"));

  return (
    <RemoteReadBoundary
      status={cardReadState.status}
      hasData={cardReadState.status === "ready" && deck != null}
      emptyContent={
        <RouteFeedback
          title="Deck not found"
          description="The requested deck is unavailable or has been removed."
          tone="not-found"
          primaryAction={{ label: "Go home", onClick: () => void navigate("/") }}
          secondaryAction={{ label: "Go back", onClick: () => void navigate(-1) }}
        />
      }
    >
      {deck != null ? (
        <AppLayout showHeader>
          <CardListComposition
            deck={deck}
            cards={cards}
            tags={tags}
            preferences={preferences}
            onEditCard={(id) => void navigate(`/card/${id}/edit`)}
          />
        </AppLayout>
      ) : null}
    </RemoteReadBoundary>
  );
};
