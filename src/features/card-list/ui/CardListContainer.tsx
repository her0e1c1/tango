import type * as React from "react";

import { type CardId, useCardsByDeckId } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import { usePreferences } from "@/entities/preferences";
import { DeckFilterForm, useDeckFilterState, useFilteredStudyCards } from "@/features/deck-filter";

import { useEditCardScore } from "../model/useEditCardScore";
import { CardList, type CardListProps } from "./CardList";

export interface CardListContainerProps {
  deck: Deck;
  renderBackText: CardListProps["renderBackText"];
  onEditCard: (id: CardId) => void;
}

export const CardListContainer: React.FC<CardListContainerProps> = (props) => {
  const preferences = usePreferences();
  const { cards: deckCards, tags } = useCardsByDeckId(props.deck.id);
  const cards = useFilteredStudyCards(props.deck, deckCards, preferences);
  const deckFilterForm = useDeckFilterState({ deck: props.deck, tags });
  const editCardScore = useEditCardScore();

  return (
    <CardList
      deck={props.deck}
      cards={cards}
      preferences={preferences}
      filter={{
        scoreMax: deckFilterForm.scoreMax,
        scoreMin: deckFilterForm.scoreMin,
        selectedTags: deckFilterForm.tagFilterProps.selectedTags ?? [],
        controls: <DeckFilterForm {...deckFilterForm} />,
        onChangeSelectedTags: (selectedTags) => deckFilterForm.tagFilterProps.onClickTag?.(selectedTags),
      }}
      renderBackText={props.renderBackText}
      onEditCard={props.onEditCard}
      onChangeScore={(card, score) => editCardScore.updateScore(card.id, score)}
    />
  );
};
