import type { Card, CardId } from "@/entities/card";
import { getCategory, isHighlightLanguage, type Deck, type DeckId } from "@/entities/deck";

import * as React from "react";
import { useKey } from "react-use";

import { toggleShowHeader, toggleShowSwipeButtonList, useConfig } from "@/shared/config";

import type { SwipeButtonListProps } from "../components/SwipeButtonList";
import { initializeStudySessionUi, touchStudySession } from "../commands/studySessionCommands";
import { selectStudySessionForRoute } from "../state/studyStore";
import { useEditStudyProgress } from "./useEditStudyProgress";
import { useStudyActions } from "./useStudyActions";
import { useStudyControllerState } from "./useStudyControllerState";
import { useStudyHydrated } from "./useStudyHydrated";
import { useStudyStore } from "./useStudyStore";

const SWIPE_FEEDBACK_DURATION_MS = 900;

interface UseStudyScreenOptions {
  cardsById: Partial<Record<CardId, Card>>;
  deck: Deck;
  readsReady: boolean;
  onUnavailable: () => void;
}

export const useStudyScreen = ({ cardsById, deck, readsReady, onUnavailable }: UseStudyScreenOptions) => {
  const deckId = deck.id;
  const config = useConfig();
  const session = useStudyStore(selectStudySessionForRoute(deckId));
  const showBackText = useStudyStore((state) => state.showBackText);
  const autoPlay = useStudyStore((state) => state.autoPlay);
  const lastSwipe = useStudyStore((state) => state.lastSwipe);
  const clearLastSwipe = useStudyStore((state) => state.clearLastSwipe);
  const hydrated = useStudyHydrated();
  const index = session?.currentIndex ?? -1;
  const cardId = index >= 0 ? session?.cardOrderIds[index] : undefined;
  const card = cardId == null ? undefined : cardsById[cardId];
  const cardMutation = useEditStudyProgress();
  const actions = useStudyActions(deckId, {
    cardsById,
    cardMutation: { update: cardMutation.update },
  });

  useKey("ArrowUp", actions.swipeUp);
  useKey("ArrowDown", actions.swipeDown);
  useKey("ArrowLeft", actions.swipeLeft);
  useKey("ArrowRight", actions.swipeRight);
  useKey("Enter", actions.toggleShowBackText);
  useKey("h", toggleShowHeader);
  useKey("b", toggleShowSwipeButtonList);
  useKey(" ", actions.toggleAutoPlay);

  React.useEffect(() => {
    if (!config.appearance.showSwipeFeedback) {
      if (lastSwipe !== undefined) clearLastSwipe();
      return;
    }
    if (lastSwipe === undefined) return;

    const timeout = window.setTimeout(clearLastSwipe, SWIPE_FEEDBACK_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [clearLastSwipe, config.appearance.showSwipeFeedback, lastSwipe]);

  const valid = session != null && index >= 0 && index < session.cardOrderIds.length && card != null;
  const controller = useStudyControllerState({
    autoPlay,
    cardInterval: config.study.cardInterval,
    enabled: card != null && config.study.cardInterval > 0,
    index,
    numberOfCards: session?.cardOrderIds.length ?? 0,
    onChange: actions.updateIndex,
    onToggleAutoPlay: actions.toggleAutoPlay,
  });
  const exitingDeck = React.useRef<DeckId>(undefined);

  React.useEffect(() => {
    if (!valid) return;
    initializeStudySessionUi(config.study.defaultAutoPlay);
    touchStudySession(deckId);
  }, [config.study.defaultAutoPlay, deckId, valid]);

  React.useEffect(() => {
    if (valid) {
      exitingDeck.current = undefined;
      return;
    }
    if (!hydrated || !readsReady || exitingDeck.current === deckId) return;

    exitingDeck.current = deckId;
    actions.resetStudy();
    onUnavailable();
  }, [actions, deckId, hydrated, onUnavailable, readsReady, valid]);

  const category = card == null ? undefined : getCategory(deck.category, card.tags);
  const swipeActions: SwipeButtonListProps = {
    disabled: false,
    onClickUp: actions.swipeUp,
    onClickDown: actions.swipeDown,
    onClickLeft: actions.swipeLeft,
    onClickRight: actions.swipeRight,
  };

  return {
    actions,
    backText: {
      category,
      code: category == null ? false : isHighlightLanguage(category),
      dark: config.appearance.darkMode,
    },
    card,
    category,
    controller,
    showBackText,
    showController: config.study.cardInterval > 0,
    showHeader: config.appearance.showHeader && !showBackText,
    showSwipeButtonList: config.controls.showSwipeButtonList,
    swipeActions,
    swipeFeedback: config.appearance.showSwipeFeedback && lastSwipe !== undefined ? lastSwipe.direction : undefined,
  };
};
