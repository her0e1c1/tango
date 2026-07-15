import { uniq } from "lodash";
import { isDefined } from "@src/util";
import { filterCardsForDeck } from "@src/lib/study";

export const getAllTags: Select<string, string[]> = (deckId) => (state) => {
  const cards = getAllByDeckId(deckId)(state);
  return uniq(cards.map((c) => c.tags).reduce((a, acc) => [...a, ...acc], [])).sort();
};

export const getAllByDeckId: Select<string, Card[]> = (deckId) => (state) => {
  return Object.values(state.card.byId)
    .filter(isDefined)
    .filter((c) => c.deckId === deckId);
};

export const getById: Select<string, Card> = (id) => (state) => {
  const card = state.card.byId[id];
  if (card == null) throw new Error(`NO CRAD ${id}`);
  return card;
};

export const getFilteredByDeckId =
  (deckId: string) =>
  (state: RootState): Card[] => {
    const deck = state.deck.byId[deckId];
    if (deck == null) return [];
    const cards = getAllByDeckId(deckId)(state);
    return filterCardsForDeck(cards, deck, state.config);
  };

export const splitByUniqueKey: Select<CardRaw[], [CardRaw[], CardEdit[]]> = (cards) => (state) => {
  const newCards: CardRaw[] = [];
  const oldCards: CardEdit[] = [];
  const byUniqueKey: Record<string, Card> = {};
  Object.values(state.card.byId)
    .filter(isDefined)
    .forEach((card) => {
      if (card.uniqueKey.length > 0) {
        byUniqueKey[card.uniqueKey] = card;
      }
    });
  cards.forEach((c) => {
    const existing = byUniqueKey[c.uniqueKey];
    if (existing != null) {
      oldCards.push({ ...c, id: existing.id, deckId: existing.deckId });
    } else {
      newCards.push(c);
    }
  });
  return [newCards, oldCards];
};
