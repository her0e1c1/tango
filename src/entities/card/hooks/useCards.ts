import { useCallback, useMemo } from "react";

import type { RemoteById } from "@/domain/remoteSnapshot";
import type { Card, CardId } from "@/entities/card/model/card";
import { selectCardsForDeck } from "@/entities/card/model/selectCardsForDeck";
import type { DeckId } from "@/entities/deck";
import { useRemoteRead } from "@/store/useRemoteRead";

const EMPTY_CARDS: RemoteById<Card> = {};

export const useCards = () => {
  const remote = useRemoteRead((state) => state.cardsById, EMPTY_CARDS);
  const cardsById = remote.data;
  const cards = useMemo(() => Object.values(cardsById).filter((card): card is Card => card != null), [cardsById]);
  const cardById = useCallback((id: CardId) => cardsById[id], [cardsById]);
  const cardsByDeckId = useCallback((deckId: DeckId) => selectCardsForDeck(cards, deckId), [cards]);

  return {
    cardsById,
    cards,
    cardById,
    cardsByDeckId,
    status: remote.status,
    syncStatus: remote.syncStatus,
    error: remote.error,
    retry: remote.retry,
  };
};

export const useCard = (cardId: CardId) => {
  const remote = useRemoteRead((state) => state.cardsById, EMPTY_CARDS);

  return {
    card: remote.data[cardId],
    status: remote.status,
    syncStatus: remote.syncStatus,
    error: remote.error,
    retry: remote.retry,
  };
};

export const useCardsByDeck = (deckId: DeckId) => {
  const { cardsByDeckId, status, syncStatus, error, retry } = useCards();
  const cards = useMemo(() => cardsByDeckId(deckId), [cardsByDeckId, deckId]);

  return {
    cards,
    status,
    syncStatus,
    error,
    retry,
  };
};

export const useTagsByDeck = (deckId: DeckId) => {
  const remote = useCardsByDeck(deckId);
  const tags = useMemo(() => [...new Set(remote.cards.flatMap((card) => card.tags))].sort(), [remote.cards]);

  return {
    tags,
    status: remote.status,
    syncStatus: remote.syncStatus,
    error: remote.error,
    retry: remote.retry,
  };
};
