import * as React from "react";
import { useSelector } from "react-redux";
export { useSelector } from "react-redux";

export const useConfigState = (...deps: (keyof ConfigState)[]): ConfigState => {
  const config = useSelector((s) => s.config);
  return React.useMemo(
    () => {
      return config;
    },
    deps.length === 0 ? undefined : deps
  );
};

export const useCurrentDeck = (deckId: string = ""): Deck => {
  const deck = useSelector((state) => state.deck.byId[deckId]);
  if (!deck) throw `NO DECK ${deckId}`;
  return deck;
};

export const useCurrentCard = (cardId: string): Card => {
  const card = useSelector((state) => state.card.byId[cardId]);
  if (!card) throw `NO CURRENT CARD ${cardId}`;
  return card;
};

export const useDeck = (deckId: string, opt?: { empty?: boolean }): Deck => {
  const deck = useSelector((state: RootState) => state.deck.byId[deckId]);
  if (!deckId) throw `NO DECK ${deckId}`;
  if (!deck) {
    if (opt && opt.empty) return {} as Deck;
    throw `NO DECK ${deckId}`;
  }
  return deck;
};

export function useDeckAttr<T extends keyof Deck>(deckId: string, key: T) {
  return useSelector((state: RootState) => state.deck.byId[deckId][key]);
}

export function useCardAttr<T extends keyof Card>(cardId: string, key: T) {
  return useSelector((state: RootState) => state.card.byId[cardId][key]);
}

export function useConfigAttr<T extends keyof ConfigState>(key: T) {
  return useSelector((s) => s.config[key]);
}

// ここが再計算は仕方がない?
export const useCardsByDeckId = (
  deckId: string,
  opt?: { isShown?: boolean }
): Card[] => {
  const isShown = opt && opt.isShown;
  const useCardInterval = useConfigAttr("useCardInterval");
  const scoreMax = useDeckAttr(deckId, "scoreMax");
  const scoreMin = useDeckAttr(deckId, "scoreMin");
  const tags = useDeckAttr(deckId, "selectedTags");
  const ids = useDeckAttr(deckId, "cardIds");
  const byId = useSelector((state) => state.card.byId); // カードを更新しないならここは、そのまま
  return React.useMemo(
    () =>
      ids
        .map((id) => byId[id])
        .filter((c) => !!c)
        .filter((c) => {
          if (isShown) {
            if (tags.length > 0 && !tags.some((t) => c.tags.includes(t))) {
              return false;
            }
            if (scoreMax != undefined && c.score > scoreMax) {
              return false;
            }
            if (scoreMin != undefined && c.score < scoreMin) {
              return false;
            }
            if (useCardInterval && c.nextSeeingAt > new Date()) {
              return false;
            }
          }
          return true;
        }),
    [tags, ids, byId, isShown, scoreMax, scoreMin, useCardInterval]
  );
};

export const useCard = (cardId: string, opt?: { empty?: boolean }): Card => {
  const card = useSelector((state: RootState) => state.card.byId[cardId]);
  if (!card) {
    if (opt && opt.empty) return {} as Card;
    throw `NO CARD ${cardId}`;
  }
  return card;
};
