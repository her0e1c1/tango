import { type ThunkResult } from ".";
import * as action from ".";
import * as firestore from "./firestore";

export const isEmpty = (c: Card): boolean => {
  return c.frontText === "" && c.backText === "";
};

export const fromRow = (row: string[]): Card => {
  const tags = typeof row[2] === "string" ? row[2].split(",") : [];
  return {
    frontText: row[0] || "",
    backText: row[1] || "",
    tags,
    uniqueKey: row[3] || "",
  } as Card;
};

export const toRow = (card: Card): string[] => [card.frontText, card.backText, card.tags.join(","), card.uniqueKey];

export const goTo =
  (cardId: string): ThunkResult =>
  async (dispatch, getState) => {
    const card = getState().card.byId[cardId];
    if (card == null) throw Error("invalid card id");
    const deck = getState().deck.byId[card.deckId];
    if (deck == null) throw Error("invalid deck id");
    let currentIndex = deck.cardOrderIds.findIndex((id) => id === cardId);
    if (currentIndex === -1) currentIndex = 0;
    await dispatch(action.deck.update({ id: deck.id, currentIndex }));
  };

export const update =
  (card: Partial<Card> & { id: string }): ThunkResult =>
  async () => {
    void firestore.card.update(card);
  };

export const updateBy =
  (cardId: CardId, callback: (c: Card) => Partial<Card>): ThunkResult =>
  async (dispatch, getState) => {
    const prev = getState().card.byId[cardId];
    if (prev == null) throw Error("invalid card id");
    const card = { ...prev, ...callback(prev) };
    dispatch(update(card));
  };

export const bulkUpdate =
  (cards: Card[]): ThunkResult =>
  async (dispatch, getState) => {
    action.card.filterCardsForUpdate(cards, getState().card).forEach((card) => {
      void firestore.card.update(card);
    });
  };

export const bulkCreate =
  (cards: Card[]): ThunkResult =>
  async () => {
    cards.forEach((c) => {
      void firestore.card.create(c);
    });
  };

export const remove =
  (id: string): ThunkResult =>
  async (dispatch, getState) => {
    const card = getState().card.byId[id];
    if (card == null) throw Error("invalid card id");
    void firestore.card.logicalRemove(id);
  };

export const filterCardsForUpdate = (cards: Card[], state: CardState): Card[] => {
  const byKey = {} as Record<string, Card>;
  Object.entries(state.byId).forEach(([id, card]) => {
    const c = card as Card;
    byKey[c.uniqueKey] = { ...c, id };
  });
  return cards
    .filter((a) => {
      const b = byKey[a.uniqueKey];
      if (b == null) return false;
      if (a.frontText === b.frontText && a.backText === b.backText) {
        return false;
      }
      return true;
    })
    .map((a) => {
      const b = byKey[a.uniqueKey];
      return { ...b, ...a };
    });
};
