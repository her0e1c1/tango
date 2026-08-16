import type * as React from "react";
import { useParams } from "react-router-dom";
import { useKey } from "react-use";

import { type Card, type CardId, useCardsByDeckId } from "@/entities/card";
import { type Deck, filterCardsForDeck, useDeck } from "@/entities/deck";
import { type Preferences, usePreferences } from "@/entities/preferences";
import { CardList, useCardListState } from "@/features/card-list";
import { BackText } from "@/features/card-view";
import { DeckFilterForm, useDeckFilterState } from "@/features/deck-filter";
import { routes, useNavigation } from "@/shared/routes";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";

const CardListComposition = (props: {
  deck: Deck;
  cards: Card[];
  tags: string[];
  preferences: Preferences;
  onEditCard: (id: CardId) => void;
}) => {
  const deckFilter = useDeckFilterState(props.deck);
  const cardList = useCardListState({
    cards: props.cards,
    deck: props.deck,
    dark: props.preferences.appearance.darkMode,
  });

  return (
    <CardList
      state={cardList}
      filter={{
        scoreMax: deckFilter.scoreMax,
        scoreMin: deckFilter.scoreMin,
        selectedTags: deckFilter.selectedTags,
        controls: <DeckFilterForm {...deckFilter} tags={props.tags} />,
        onRemoveTag: (tag) => deckFilter.setSelectedTags(deckFilter.selectedTags.filter((value) => value !== tag)),
      }}
      {...(cardList.answer !== undefined ? { answerSlot: <BackText {...cardList.answer} /> } : {})}
      onEditCard={props.onEditCard}
    />
  );
};

export const CardListPage: React.FC = () => {
  const params = useParams();
  const navigation = useNavigation();
  const deckId = params.id;
  if (deckId == null) throw new Error("invalid deck id");
  const preferences = usePreferences();
  const deck = useDeck(deckId);
  const { cards: deckCards, tags } = useCardsByDeckId(deckId);
  const cards = deck == null ? [] : filterCardsForDeck(deckCards, deck, preferences.study);

  useKey("t", () => void navigation.to(routes.deckList.to()));
  useKey("s", () => void navigation.to(routes.settings.to()));

  if (deck == null) {
    return (
      <RouteFeedback
        title="Deck not found"
        description="The requested deck is unavailable or has been removed."
        tone="not-found"
        primaryAction={{ label: "Go home", onClick: () => void navigation.to(routes.deckList.to()) }}
        secondaryAction={{ label: "Go back", onClick: () => void navigation.back() }}
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
        onEditCard={(id) => void navigation.to(routes.cardForm.to(id))}
      />
    </AppLayout>
  );
};
