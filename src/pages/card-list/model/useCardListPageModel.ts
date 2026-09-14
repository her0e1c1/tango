import { useStore } from "zustand";
import { useAuth } from "@/entities/auth";
import { type CardId, mustFindCardById } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import type { Difficulty } from "@/entities/study-progress";
import { cancelCardDeletion } from "./actions/cancelCardDeletion";
import { showCardAnswer } from "./actions/showCardAnswer";
import { cancelBulkDifficulty } from "./actions/cancelBulkDifficulty";
import { changeBulkDifficulty } from "./actions/changeBulkDifficulty";
import { changeCardDifficulty } from "./actions/changeCardDifficulty";
import { confirmBulkDifficulty } from "./actions/confirmBulkDifficulty";
import { confirmCardDeletion } from "./actions/confirmCardDeletion";
import { requestBulkDifficulty } from "./actions/requestBulkDifficulty";
import { requestCardDeletion } from "./actions/requestCardDeletion";
import { useCardListQuery } from "./queries/useCardListQuery";
import { useCardListStore } from "./useCardListStore";

export function useCardListPageModel(deck: Deck) {
  const { uid } = useAuth();
  const store = useCardListStore();
  const state = useStore(store);
  const query = useCardListQuery(deck, state.shownCard);
  return {
    ...state,
    ...query,
    requestBulk: () => requestBulkDifficulty(store, query.cards),
    cancelBulk: () => cancelBulkDifficulty(store),
    confirmBulk: () => confirmBulkDifficulty(store, uid),
    changeBulkDifficulty: (difficulty: Difficulty | null) => changeBulkDifficulty(store, difficulty),
    confirmDeletion: () => confirmCardDeletion(store, uid),
    cancelDeletion: () => cancelCardDeletion(store),
    requestDeletion: (id: CardId) => requestCardDeletion(store, mustFindCardById(query.cards, id)),
    swipeLeft: (id: CardId) => void changeCardDifficulty(store, uid, mustFindCardById(query.cards, id), "not-mastered"),
    swipeRight: (id: CardId) => void changeCardDifficulty(store, uid, mustFindCardById(query.cards, id), "mastered"),
    showAnswer: (id: CardId) => showCardAnswer(store, mustFindCardById(query.cards, id)),
    closeAnswer: () => showCardAnswer(store, undefined),
  };
}
