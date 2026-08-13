/**
 * @file Provides the study feature's Use Study Actions React hook.
 * The hook combines state and operations behind one interface so components do not need to
 * coordinate services themselves.
 */

import type { Card, CardId } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import type { StudyProgressEdit } from "@/entities/study-progress";
import type { ConfigState, SwipeDirection } from "@/shared/config";

import React from "react";

import { selectCardsForDeck, useCards } from "@/entities/card";
import { useDecks } from "@/entities/deck";
import { useStudyCards } from "@/features/study/hooks/useStudyCards";
import { buildStudySession, calculateNextIndex } from "@/features/study/model/session";
import { createStudyCard } from "@/features/study/model/studyCard";
import { buildStudyPatch, resolveSwipeAction } from "@/features/study/model/swipe";
import { studyStore } from "@/features/study/state/studyStore";
import { useConfig } from "@/shared/config";

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

interface StudyProgressMutation {
  isPending: (id: CardId) => boolean;
  update: (progress: StudyProgressEdit) => Promise<void>;
  pending: boolean;
  error: unknown;
  retry: () => void;
}

interface UseStudyActionsOptions {
  progressMutation?: StudyProgressMutation;
  onStarted?: () => void;
}

interface StudySwipeDependencies {
  mutationTokenRef: { current: symbol | undefined };
  deckId: DeckId;
  config: ConfigState;
  cardsById: Partial<Record<CardId, Card>>;
  isPending: (id: CardId) => boolean;
  update: (progress: StudyProgressEdit) => Promise<void>;
}

const applyOptimisticUpdate = (deckId: DeckId, nextIndex: number) => {
  const state = studyStore.getState();
  if (nextIndex < 0) state.removeStudy(deckId);
  else state.setCurrentIndex(deckId, nextIndex);
  return studyStore.getState().sessionsByDeckId[deckId];
};

type StudyState = ReturnType<typeof studyStore.getState>;
type Session = StudyState["sessionsByDeckId"][string];

const revertOptimisticUpdate = (
  deckId: DeckId,
  nextIndex: number,
  mutationTokenRef: { current: symbol | undefined },
  mutationToken: symbol,
  optimisticSession: Session,
  previous: { session: Session; showBackText: boolean; lastSwipe: StudyState["lastSwipe"] }
) => {
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
};

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

  const swipeAction = resolveSwipeAction(config.controls, direction);
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
  if (config.appearance.hideBodyWhenCardChanged) {
    state.hideBackText();
  }

  const patch = buildStudyPatch(createStudyCard(card), swipeAction, Date.now());
  const nextIndex = calculateNextIndex(session.currentIndex, session.cardOrderIds.length, swipeAction);
  const mutationToken = Symbol();
  mutationTokenRef.current = mutationToken;
  const optimisticSession = applyOptimisticUpdate(deckId, nextIndex);
  try {
    await update(patch);
  } catch {
    revertOptimisticUpdate(deckId, nextIndex, mutationTokenRef, mutationToken, optimisticSession, previous);
  } finally {
    if (mutationTokenRef.current === mutationToken) mutationTokenRef.current = undefined;
  }
};

/**
 * Provides the study actions values and operations needed by React components.
 * Callers receive one focused interface without coordinating the study feature's stores and
 * services themselves.
 */
export const useStudyActions = (
  deckId: DeckId,
  { progressMutation, onStarted }: UseStudyActionsOptions = {}
): StudyActions => {
  const config = useConfig();
  const cardRemote = useCards();
  const deckRemote = useDecks();
  const deckCards = React.useMemo(() => selectCardsForDeck(cardRemote.cards, deckId), [cardRemote.cards, deckId]);
  const cards = useStudyCards(deckRemote.decksById[deckId], deckCards, config);
  const cardsById = cardRemote.cardsById;
  const mutationTokenRef = React.useRef<symbol | undefined>(undefined);

  /**
   * Creates a new study session from the currently filtered cards.
   * The saved UI preferences are applied before the Page is notified that the session is ready.
   */
  const start = () => {
    const cardOrderIds = buildStudySession(cards, config.study);
    const state = studyStore.getState();
    state.startStudy(deckId, cardOrderIds);
    state.initializeStudyUi(config.study.defaultAutoPlay);
    onStarted?.();
  };

  /**
   * Runs the study workflow for one swipe direction.
   * Direction-specific callbacks reuse this function so pending checks, optimistic state, and
   * persistence stay identical.
   */
  const swipe = (direction: SwipeDirection) => {
    if (progressMutation == null) return Promise.resolve();
    return runStudySwipe(direction, {
      mutationTokenRef,
      deckId,
      config,
      cardsById,
      isPending: progressMutation.isPending,
      update: progressMutation.update,
    });
  };

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
    pending: progressMutation?.pending ?? false,
    error: progressMutation?.error,
    retry: progressMutation?.retry ?? (() => undefined),
  };
};
