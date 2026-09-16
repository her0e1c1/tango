import { useLayoutEffect } from "react";
import { useStore } from "zustand";
import { useAuth } from "@/entities/auth";
import { type CardId, mustFindCardById } from "@/entities/card";
import type { Deck } from "@/entities/deck";
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
import { cardListStore } from "./store";
import { enterCardListPage } from "./actions/enterCardListPage";

export function useCardListPageModel(deck: Deck) {
  const { uid } = useAuth();
  const state = useStore(cardListStore);
  // Reset the previous visit before its dialogs can paint or accept input.
  useLayoutEffect(enterCardListPage, []);
  const query = useCardListQuery(deck, state.shownCard, state.deletionTarget);
  return {
    ...state,
    ...query,
    mutationPending: state.mutationId !== undefined,
    requestBulk: () => requestBulkDifficulty(query.cards),
    cancelBulk: cancelBulkDifficulty,
    confirmBulk: () => confirmBulkDifficulty(uid),
    changeBulkDifficulty,
    confirmDeletion: () => confirmCardDeletion(uid),
    cancelDeletion: cancelCardDeletion,
    requestDeletion: requestCardDeletion,
    swipeLeft: (id: CardId) => void changeCardDifficulty(uid, mustFindCardById(query.cards, id), "not-mastered"),
    swipeRight: (id: CardId) => void changeCardDifficulty(uid, mustFindCardById(query.cards, id), "mastered"),
    showAnswer: (id: CardId) => showCardAnswer(mustFindCardById(query.cards, id)),
    closeAnswer: () => showCardAnswer(undefined),
  };
}
