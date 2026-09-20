import { useNavigate } from "react-router-dom";
import { useStore } from "zustand";
import { useAuth } from "@/entities/auth";
import { type CardId, mustFindCardById } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import {
  clearDeckFilterRange,
  getDeckFilterState,
  updateDeckFilterDraft,
  useDeckFilterDraft,
  useDeckFilterSaveLifecycle,
} from "@/features/deck-filter";
import { routes } from "@/shared/router";
import { useResetStoreOnMount } from "@/shared/lib/useResetStoreOnMount";
import { changeCardSortOrder } from "./actions/changeCardSortOrder";
import { cancelCardDeletion } from "./actions/cancelCardDeletion";
import { showCardAnswer } from "./actions/showCardAnswer";
import { cancelBulkDifficulty } from "./actions/cancelBulkDifficulty";
import { changeBulkDifficulty } from "./actions/changeBulkDifficulty";
import { changeCardDifficulty } from "./actions/changeCardDifficulty";
import { confirmBulkDifficulty } from "./actions/confirmBulkDifficulty";
import { confirmCardDeletion } from "./actions/confirmCardDeletion";
import { requestBulkDifficulty } from "./actions/requestBulkDifficulty";
import { requestCardDeletion } from "./actions/requestCardDeletion";
import { removeCardListTag } from "./actions/removeCardListTag";
import { getCardListControls } from "./queries/getCardListControls";
import { useCardListQuery } from "./queries/useCardListQuery";
import { cardListStore } from "./store";

export function useCardListPageModel(deck: Deck) {
  const { uid } = useAuth();
  const navigate = useNavigate();
  const state = useStore(cardListStore);
  useResetStoreOnMount(cardListStore);
  const filterDraft = useDeckFilterDraft(uid, deck);
  useDeckFilterSaveLifecycle(filterDraft.state.pending, filterDraft.setState);
  const filterUpdate = {
    uid,
    deckId: deck.id,
    draft: filterDraft.state.draft,
    setState: filterDraft.setState,
  };
  const deckFilter = getDeckFilterState(filterDraft.state);
  const controls = getCardListControls(state, deckFilter);
  // Include selections whose autosaves are still pending from another Page.
  const query = useCardListQuery({
    deck,
    filter: filterDraft.state.draft,
    shownCard: state.shownCard,
    sortOrder: state.sortOrder,
  });
  return {
    ...state,
    ...query,
    changeSortOrder: changeCardSortOrder,
    ...controls,
    deckFilter,
    clearDifficultyRange: () => clearDeckFilterRange(filterUpdate),
    setDifficultyMax: (difficultyMax: number | null) => updateDeckFilterDraft({ difficultyMax }, filterUpdate),
    setDifficultyMin: (difficultyMin: number | null) => updateDeckFilterDraft({ difficultyMin }, filterUpdate),
    setSelectedTags: (selectedTags: string[]) => updateDeckFilterDraft({ selectedTags }, filterUpdate),
    setTagAndFilter: (tagAndFilter: boolean) => updateDeckFilterDraft({ tagAndFilter }, filterUpdate),
    removeTag: (tag: string) => removeCardListTag(tag, filterUpdate),
    goToDeckList: () => {
      if (!controls.dialogOpen) void navigate(routes.deckList.to());
    },
    goToSettings: () => {
      if (!controls.dialogOpen) void navigate(routes.settings.to());
    },
    goToCardCreate: () => void navigate(routes.cardCreate.to(deck.id)),
    goToCardEdit: (id: CardId) => void navigate(routes.cardForm.to(id)),
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
