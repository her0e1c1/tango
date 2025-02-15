import { type ThunkResult } from ".";
import * as action from ".";
import * as firestore from "./firestore";
import * as selector from "../selector";

export const isEmpty = (c: CardRaw): boolean => {
  return c.frontText === "" && c.backText === "";
};

export const fromRow = (row: string[]): CardRaw => {
  const tags = typeof row[2] === "string" ? row[2].split(",") : [];
  return {
    frontText: row[0] || "",
    backText: row[1] || "",
    tags,
    uniqueKey: row[3] || "",
  };
};

export const toRow = (card: Card): string[] => [card.frontText, card.backText, card.tags.join(","), card.uniqueKey];

export const goTo =
  (cardId: string): ThunkResult =>
    async (dispatch, getState) => {
      const deck = selector.deck.getByCardId(cardId)(getState())
      let currentIndex = deck.cardOrderIds.findIndex((id) => id === cardId);
      if (currentIndex === -1) currentIndex = 0;
      await dispatch(action.deck.update({ id: deck.id, currentIndex }));
    };

export const prepare = (card: CardRaw, deck: CardDeck): Card => {
  const { uid, id: deckId } = deck;
  return {
    ...card,
    uid,
    deckId,
    id: firestore.mocked.generateCardId(),
    score: 0,
    numberOfSeen: 0,
    createdAt: 0,
    updatedAt: 0,
    deletedAt: null,
  };
};

export const bulkCreate =
  (cards: CardRaw[], deckId: DeckId): ThunkResult =>
    async (dispatch, getState) => {
      const deck = selector.deck.getById(deckId)(getState());
      await Promise.all(
        cards.map(async (card) => {
          const c = prepare(card, deck);
          if (!deck.localMode) {
            void firestore.card.create(c);
          }
          await dispatch(action.type.cardInsert(c));
        })
      );
    };

export const update =
  (card: CardEdit): ThunkResult =>
    async (dispatch, getState) => {
      const deck = selector.deck.getById(card.deckId)(getState())
      if (!deck.localMode) {
        void firestore.card.update(card);
      }
      await dispatch(action.type.cardUpdate(card));
    };

export const updateBy =
  (cardId: CardId, callback: (c: Card) => Partial<Card>): ThunkResult =>
    async (dispatch, getState) => {
      const prev = selector.card.getById(cardId)(getState())
      const card = { ...prev, ...callback(prev) };
      await dispatch(update(card));
    };

export const bulkUpdate =
  (cards: CardEdit[]): ThunkResult =>
    async (dispatch, getState) => {
      await Promise.all(
        action.card.filterCardsForUpdate(cards, getState().card).map(async (c) => {
          await dispatch(action.type.cardUpdate(c));
          const deck = selector.deck.getById(c.deckId)(getState())
          if (!deck.localMode) {
            void firestore.card.update(c);
          }
        })
      );
    };

export const remove =
  (id: string): ThunkResult =>
    async (dispatch, getState) => {
      const deck = selector.deck.getByCardId(id)(getState())
      if (!deck.localMode) {
        void firestore.card.logicalRemove(id);
      }
      await dispatch(action.type.cardDelete(id));
    };

export const filterCardsForUpdate = (cards: CardEdit[], state: CardState): Card[] => {
  const byKey = {} as Record<string, Card>;
  Object.entries(state.byId).forEach(([id, card]) => {
    const c = card as Card;
    byKey[c.uniqueKey] = { ...c, id };
  });
  return cards
    .filter((a) => {
      const b = byKey[a.uniqueKey ?? ""];
      if (b == null) return false;
      if (a.frontText === b.frontText && a.backText === b.backText) {
        return false;
      }
      return true;
    })
    .map((a) => {
      const b = byKey[a.uniqueKey ?? ""]; // b is not null here
      return { ...b, ...a };
    });
};
