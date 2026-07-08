import { uniq } from "lodash";
import { isDefined } from "src/util";
import { filterCardsForDeck } from "src/lib/study";

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

export const getCurrentByDeckId: Select<string, Card | undefined> = (id) => (state) => {
  const deck = state.deck.byId[id];
  if (deck == null) throw new Error(`INVALID DECK ID ${id}`);
  if (deck.currentIndex == -1) return undefined;
  const cardId = deck.cardOrderIds[deck.currentIndex ?? 0];
  if (cardId == null) throw new Error(`NO CURRENT CRAD IN DECK ${id}`);
  const card = state.card.byId[cardId];
  if (card == null) throw new Error(`NO CURRENT CRAD IN DECK ${id}`);
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

export const splitByUniqueKey: Select<Card[], [CardRaw[], Card[]]> = (cards) => (state) => {
  const newCards = [] as Card[];
  const oldCards = [] as Card[];
  const byUniqueKey = {} as Record<string, string>;
  Object.keys(state.card.byId).forEach((id) => {
    const key = (state.card.byId[id] as Card).uniqueKey;
    if (key.length > 0) {
      byUniqueKey[key] = id;
    }
  });
  cards.forEach((c) => {
    const id = byUniqueKey[c.uniqueKey];
    if (id) {
      oldCards.push(c);
    } else {
      newCards.push(c);
    }
  });
  return [newCards, oldCards];
};
