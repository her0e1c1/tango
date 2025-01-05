import { uniq } from "lodash";
import { isDefined } from "src/util";

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
  if (deck == null) return undefined;
  const cardId = deck.cardOrderIds[deck.currentIndex ?? 0]; // FIXME: remove ?? 0
  if (cardId == null) return undefined;
  const card = state.card.byId[cardId];
  if (card == null) throw new Error(`NO CURRENT CRAD IN DECK ${id}`);
  return card;
};

export const getFilteredByDeckId =
  (deckId: string) =>
  (state: RootState): Card[] => {
    const deck = state.deck.byId[deckId];
    if (deck == null) return [];
    const config = state.config;
    return getAllByDeckId(deckId)(state).filter((c) => {
      const tags = deck.selectedTags;
      if (tags.length > 0) {
        if (deck.tagAndFilter && !tags.every((t) => c.tags.includes(t))) {
          return false;
        }
        if (!deck.tagAndFilter && !tags.some((t) => c.tags.includes(t))) {
          return false;
        }
      }
      if (deck.scoreMax != null && c.score > deck.scoreMax) {
        return false;
      }
      if (deck.scoreMin != null && c.score < deck.scoreMin) {
        return false;
      }
      if (config.useCardInterval && c.nextSeeingAt > new Date()) {
        return false;
      }
      return true;
    });
  };
