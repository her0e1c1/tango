/**
 * @file Provides the study feature's Use Study Actions React hook.
 * The hook combines state and operations behind one interface so components do not need to
 * coordinate services themselves.
 */

import React from "react";

import { useNavigate } from "react-router-dom";

import { useRemoteCollections } from "@/query/useRemoteCollections";
import { studyStore } from "@/features/study/state/studyStore";
import { buildStudyPatch, buildStudySession, calculateNextIndex, resolveSwipeAction } from "@/lib/study";
import { useCardMutations } from "@/features/card/hooks/useCardMutations";
import { useConfig } from "@/hooks/useConfig";

export interface StudyActions {
  start: () => void;
  swipeUp: () => Promise<void>;
  swipeDown: () => Promise<void>;
  swipeLeft: () => Promise<void>;
  swipeRight: () => Promise<void>;
  updateIndex: (currentIndex: number) => void;
  toggleShowBackText: () => void;
  toggleAutoPlay: () => void;
  resetStudy: () => void;
  pending: boolean;
  error: unknown;
  retry: () => void;
}

interface StudySwipeDependencies {
  mutationTokenRef: { current: symbol | undefined };
  deckId: DeckId;
  config: ConfigState;
  cardsById: Partial<Record<CardId, Card>>;
  isPending: (id: CardId) => boolean;
  update: (card: CardEdit) => Promise<void>;
}

/**
 * Runs the study swipe workflow for the study feature.
 * The sequence and its cleanup remain together so partial failures can be handled consistently.
 */
const runStudySwipe = async (
  direction: SwipeDirection,
  { mutationTokenRef, deckId, config, cardsById, isPending, update }: StudySwipeDependencies
): Promise<void> => {
  if (mutationTokenRef.current !== undefined) return;
  const state = studyStore.getState();
  const session = state.sessionsByDeckId[deckId];
  if (session == null) return;

  const swipeAction = resolveSwipeAction(config, direction);
  if (swipeAction === "DoNothing") return;

  if (swipeAction === "GoBack") {
    state.setLastSwipe(direction);
    state.removeStudy(deckId);
    return;
  }

  const cardId = session.cardOrderIds[session.currentIndex];
  const card = cardId == null ? undefined : cardsById[cardId];
  if (card == null || isPending(card.id)) return;

  const previous = {
    session: { ...session },
    showBackText: state.showBackText,
    lastSwipe: state.lastSwipe,
  };

  state.setLastSwipe(direction);
  if (config.hideBodyWhenCardChanged) {
    state.hideBackText();
  }

  const patch = buildStudyPatch(card, swipeAction, Date.now());
  const nextIndex = calculateNextIndex(session.currentIndex, session.cardOrderIds.length, swipeAction);
  const mutationToken = Symbol();
  mutationTokenRef.current = mutationToken;
  if (nextIndex < 0) state.removeStudy(deckId);
  else state.setCurrentIndex(deckId, nextIndex);
  const optimisticSession = studyStore.getState().sessionsByDeckId[deckId];
  try {
    await update(patch);
  } catch {
    const current = studyStore.getState();
    const currentSession = current.sessionsByDeckId[deckId];
    const changeStillCurrent =
      mutationTokenRef.current === mutationToken &&
      (nextIndex < 0 ? currentSession == null : currentSession === optimisticSession);
    if (changeStillCurrent) {
      studyStore.setState((state) => ({
        sessionsByDeckId: { ...state.sessionsByDeckId, [deckId]: previous.session },
        showBackText: previous.showBackText,
        lastSwipe: previous.lastSwipe,
      }));
    }
  } finally {
    if (mutationTokenRef.current === mutationToken) mutationTokenRef.current = undefined;
  }
};

/**
 * Provides the study actions values and operations needed by React components.
 * Callers receive one focused interface without coordinating the study feature's stores and
 * services themselves.
 */
export const useStudyActions = (deckId: DeckId): StudyActions => {
  const navigate = useNavigate();
  const config = useConfig();
  const remote = useRemoteCollections();
  const cards = remote.filteredCardsByDeckId(deckId, config);
  const cardsById = remote.cardsById;
  const cardMutations = useCardMutations();
  const mutationTokenRef = React.useRef<symbol | undefined>(undefined);

  /**
   * Creates a new study session from the currently filtered cards and opens the study route.
   * The saved UI preferences are applied before navigation so the first card renders in the
   * expected state.
   */
  const start = () => {
    const cardOrderIds = buildStudySession(cards, config);
    const state = studyStore.getState();
    state.startStudy(deckId, cardOrderIds);
    state.initializeStudyUi(config.defaultAutoPlay);
    void navigate(`/deck/${deckId}/study`, { replace: true });
  };

  /**
   * Runs the study workflow for one swipe direction.
   * Direction-specific callbacks reuse this function so pending checks, optimistic state, and
   * persistence stay identical.
   */
  const swipe = (direction: SwipeDirection) =>
    runStudySwipe(direction, {
      mutationTokenRef,
      deckId,
      config,
      cardsById,
      isPending: cardMutations.isPending,
      update: cardMutations.update,
    });

  return {
    start,
    swipeUp: () => swipe("cardSwipeUp"),
    swipeDown: () => swipe("cardSwipeDown"),
    swipeLeft: () => swipe("cardSwipeLeft"),
    swipeRight: () => swipe("cardSwipeRight"),
    updateIndex: (currentIndex: number) => {
      const state = studyStore.getState();
      if (state.sessionsByDeckId[deckId] == null) return;
      state.hideBackText();
      state.setCurrentIndex(deckId, currentIndex);
    },
    toggleShowBackText: () => studyStore.getState().toggleShowBackText(),
    toggleAutoPlay: () => studyStore.getState().toggleAutoPlay(),
    resetStudy: () => studyStore.getState().removeStudy(deckId),
    pending: cardMutations.pending,
    error: cardMutations.error,
    retry: cardMutations.retry,
  };
};
