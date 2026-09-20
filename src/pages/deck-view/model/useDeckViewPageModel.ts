import { useNavigate } from "react-router-dom";
import { useStore } from "zustand";
import { useAuth } from "@/entities/auth";
import type { Deck } from "@/entities/deck";
import {
  toggleShowHelp,
  toggleShowCardDetails,
  toggleShowPlaybackControls,
  toggleShowSwipeButtonList,
} from "@/entities/preference";
import { useDeckFilterDraft } from "@/features/deck-filter";
import { useResetStoreOnMount } from "@/shared/lib/useResetStoreOnMount";
import { routes } from "@/shared/router";
import { flipCard } from "./actions/flipCard";
import { moveCard } from "./actions/moveCard";
import { changeIndex } from "./actions/changeIndex";
import { openHelp } from "./actions/openHelp";
import { closeHelp } from "./actions/closeHelp";
import { toggleAutoPlay } from "./actions/toggleAutoPlay";
import { useDeckViewAutoPlay } from "./actions/useDeckViewAutoPlay";
import { useDeckViewShortcuts } from "./actions/useDeckViewShortcuts";
import { useDeckViewQuery } from "./queries/useDeckViewQuery";
import { deckViewStore } from "./store";

export function useDeckViewPageModel(deck: Deck) {
  const navigate = useNavigate();
  const { uid } = useAuth();
  const filter = useDeckFilterDraft(uid, deck);
  const state = useStore(deckViewStore);
  useResetStoreOnMount(deckViewStore);
  const query = useDeckViewQuery(deck, filter.state.draft, state.cardId, state.showBackText);
  useDeckViewAutoPlay(query.cards, query.card?.id, query.cardInterval, navigate);
  useDeckViewShortcuts(query.cards, query.playbackAvailable, navigate);
  return {
    ...query,
    autoPlay: state.autoPlay,
    helpOpen: state.helpOpen,
    previous: () => moveCard(query.cards, -1, navigate),
    next: () => moveCard(query.cards, 1, navigate),
    changeIndex: (index: number) => changeIndex(query.cards, index),
    flip: () => flipCard(query.cards),
    back: () => void navigate(routes.deckList.to()),
    openHelp,
    closeHelp,
    toggleAutoPlay,
    toggleShowHelp,
    toggleShowCardDetails,
    toggleShowPlaybackControls,
    toggleShowSwipeButtonList,
  };
}
