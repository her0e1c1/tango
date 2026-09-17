import { useStore } from "zustand";
import { useAuth } from "@/entities/auth";
import { type CardId, mustFindCardById } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import { useResetStoreOnMount } from "@/shared/lib/useResetStoreOnMount";
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

export function useCardListPageModel(deck: Deck) {
  const { uid } = useAuth();
  const state = useStore(cardListStore);
  useResetStoreOnMount(cardListStore);
  const query = useCardListQuery(deck, state.shownCard);
  return {
    ...state,
    ...query,
    mutationPending: state.mutationId !== undefined,
    requestBulk: () => requestBulkDifficulty(query.cards),
    cancelBulk: cancelBulkDifficulty,
    confirmBulk: confirmBulkDifficulty,
    changeBulkDifficulty,
    confirmDeletion: () => confirmCardDeletion(uid),
    cancelDeletion: cancelCardDeletion,
    requestDeletion: requestCardDeletion,
    swipeLeft: (id: CardId) => void changeCardDifficulty(id, "not-mastered"),
    swipeRight: (id: CardId) => void changeCardDifficulty(id, "mastered"),
    showAnswer: (id: CardId) => showCardAnswer(mustFindCardById(query.cards, id)),
    closeAnswer: () => showCardAnswer(undefined),
  };
}
