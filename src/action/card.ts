import type { ThunkResult } from "@/action";
import * as action from "@/action";
import * as firestore from "@/action/firestore";
import * as selector from "@/selector";

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
          await firestore.card.create(c);
        }
        await dispatch(action.type.cardInsert(c));
      })
    );
  };

export const bulkUpdate =
  (cards: CardEdit[]): ThunkResult =>
  async (dispatch, getState) => {
    await Promise.all(
      action.card.filterCardsForUpdate(cards, getState().card).map(async (c) => {
        await dispatch(action.type.cardUpdate(c));
        const deck = selector.deck.getById(c.deckId)(getState());
        if (!deck.localMode) {
          await firestore.card.update(c);
        }
      })
    );
  };

export const filterCardsForUpdate = (cards: CardEdit[], state: CardState): Card[] => {
  const byKey = {} as Record<string, Card>;
  Object.entries(state.byId).forEach(([id, card]) => {
    const c = card as Card;
    byKey[c.uniqueKey] = { ...c, id };
  });
  return cards.flatMap((a) => {
    const b = byKey[a.uniqueKey ?? ""];
    if (b == null || (a.frontText === b.frontText && a.backText === b.backText)) {
      return [];
    }
    return [{ ...b, ...a }];
  });
};
