import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";
import { useStore } from "zustand";
import { useAuth } from "@/entities/auth";
import type { Deck } from "@/entities/deck";
import { useDeckFilterDraft } from "@/features/deck-filter";
import { useResetStoreOnMount } from "@/shared/lib/useResetStoreOnMount";
import { routes } from "@/shared/router";
import { flipCard } from "./actions/flipCard";
import { moveCard } from "./actions/moveCard";
import { useDeckViewQuery } from "./queries/useDeckViewQuery";
import { deckViewStore } from "./store";

export function useDeckViewPageModel(deck: Deck) {
  const navigate = useNavigate();
  const { uid } = useAuth();
  const filter = useDeckFilterDraft(uid, deck);
  const state = useStore(deckViewStore);
  useResetStoreOnMount(deckViewStore);
  const query = useDeckViewQuery(deck, filter.state.draft, state.cardId, state.showBackText);
  const previous = () => moveCard(query.cards, -1, navigate);
  const next = () => moveCard(query.cards, 1, navigate);
  useKey(
    (event) => event.key === "ArrowLeft" && !event.altKey && !event.ctrlKey && !event.metaKey,
    (event) => {
      event.preventDefault();
      previous();
    },
    undefined,
    [previous]
  );
  useKey(
    (event) => event.key === "ArrowRight" && !event.altKey && !event.ctrlKey && !event.metaKey,
    (event) => {
      event.preventDefault();
      next();
    },
    undefined,
    [next]
  );
  return {
    ...query,
    deckName: deck.name,
    previous,
    next,
    flip: () => flipCard(query.cards),
    back: () => void navigate(routes.deckList.to()),
  };
}
