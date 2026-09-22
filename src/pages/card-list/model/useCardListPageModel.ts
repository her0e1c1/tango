import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";
import { useStore } from "zustand";
import { useAuth } from "@/entities/auth";
import type { CardId } from "@/entities/card";
import { type Deck, useDeck } from "@/entities/deck";
import {
  clearDeckFilters,
  getDeckFilterState,
  updateDeckFilterDraft,
  useDeckFilterDraft,
  useDeckFilterSaveLifecycle,
} from "@/features/deck-filter";
import { routes } from "@/shared/router";
import { useResetStoreOnMount } from "@/shared/lib/useResetStoreOnMount";
import { changeCardSortOrder } from "./actions/changeCardSortOrder";
import { cancelCardDeletion } from "./actions/cancelCardDeletion";
import { closeCardAnswer } from "./actions/closeCardAnswer";
import { showCardAnswer } from "./actions/showCardAnswer";
import { confirmCardDeletion } from "./actions/confirmCardDeletion";
import { requestCardDeletion } from "./actions/requestCardDeletion";
import { getRemainingCardListTags } from "./queries/getRemainingCardListTags";
import { getCardListControls } from "./queries/getCardListControls";
import { useCardListQuery } from "./queries/useCardListQuery";
import { cardListStore } from "./store";

export function useCardListRouteModel(deckId: string | undefined) {
  if (deckId == null) throw new Error("invalid deck id");
  const deck = useDeck(deckId);
  return { deckId, deck };
}

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
  const goToDeckList = () => {
    if (!controls.dialogOpen) void navigate(routes.deckList.to());
  };
  const goToSettings = () => {
    if (!controls.dialogOpen) void navigate(routes.settings.to());
  };
  useKey("t", goToDeckList, undefined, [goToDeckList]);
  useKey("s", goToSettings, undefined, [goToSettings]);

  const goToCardCreate = () => void navigate(routes.cardCreate.to(deck.id));
  const clearFilters = () => clearDeckFilters(filterUpdate);

  const empty = query.emptyReason
    ? {
        reason: query.emptyReason,
        onAddCard: goToCardCreate,
        onClearFilters: clearFilters,
      }
    : undefined;

  return {
    ...state,
    ...query,
    empty,
    changeSortOrder: changeCardSortOrder,
    ...controls,
    deckFilter,
    clearFilters,
    setSelectedTags: (selectedTags: string[]) => updateDeckFilterDraft({ selectedTags }, filterUpdate),
    setTagAndFilter: (tagAndFilter: boolean) => updateDeckFilterDraft({ tagAndFilter }, filterUpdate),
    removeTag: (tag: string) =>
      updateDeckFilterDraft(
        { selectedTags: getRemainingCardListTags(filterDraft.state.draft.selectedTags, tag) },
        filterUpdate
      ),

    goToCardCreate,
    goToCardEdit: (id: CardId) => void navigate(routes.cardForm.to(id)),
    confirmDeletion: confirmCardDeletion,
    cancelDeletion: cancelCardDeletion,
    requestDeletion: requestCardDeletion,
    showAnswer: showCardAnswer,
    closeAnswer: closeCardAnswer,
  };
}
