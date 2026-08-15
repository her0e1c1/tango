/**
 * @file Provides the study feature's Use Study Actions React hook.
 * The hook combines state and operations behind one interface so components do not need to
 * coordinate services themselves.
 */

import type { Card } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import type { StudyProgressEdit } from "@/entities/study-progress";
import type { Preferences, SwipeDirection } from "@/entities/preferences";

import React from "react";

import { buildStudySession, resolveStudyTransition } from "../model/session";
import { createStudyCard } from "../model/studyCard";
import { buildStudyPatch, resolveSwipeAction } from "../model/swipe";
import { studyStore } from "../state/studyStoreInstance";
import { usePreferences } from "@/entities/preferences";

export interface StudyActions {
  start: (cards: Card[]) => void;
  restart: (cardOrderIds: string[]) => void;
  exitStudy: () => void;
  swipeUp: () => Promise<void>;
  swipeDown: () => Promise<void>;
  swipeLeft: () => Promise<void>;
  swipeRight: () => Promise<void>;
  updateIndex: (currentIndex: number) => void;
  toggleShowBackText: () => void;
  toggleAutoPlay: () => void;
  resetStudy: () => void;
}

interface StudyCardMutation {
  update: (progress: StudyProgressEdit) => Promise<void>;
}

type SwipeRollback = () => void;

interface UseStudyActionsOptions {
  cards?: readonly Card[] | undefined;
  cardMutation?: StudyCardMutation | undefined;
  onStarted?: (() => void) | undefined;
  onSwipe?: ((direction: SwipeDirection) => SwipeRollback | undefined) | undefined;
  showBackText?: boolean | undefined;
  onHideBackText?: (() => void) | undefined;
  onToggleBackText?: (() => void) | undefined;
  onRestoreBackText?: ((showBackText: boolean) => void) | undefined;
  onToggleAutoPlay?: (() => void) | undefined;
  onStopAutoPlay?: (() => void) | undefined;
  onExit?: ((deckId: DeckId) => void) | undefined;
  onCompleted?: ((completion: { deckId: DeckId; cardOrderIds: string[] }) => void) | undefined;
}

interface StudySwipeDependencies {
  mutationTokenRef: { current: symbol | undefined };
  exitGenerationRef: { current: number };
  deckId: DeckId;
  preferences: Preferences;
  cards: readonly Card[];
  update: (progress: StudyProgressEdit) => Promise<void>;
  onSwipe?: ((direction: SwipeDirection) => SwipeRollback | undefined) | undefined;
  showBackText?: boolean | undefined;
  onHideBackText?: (() => void) | undefined;
  onRestoreBackText?: ((showBackText: boolean) => void) | undefined;
  onStopAutoPlay?: (() => void) | undefined;
  onExit?: ((deckId: DeckId) => void) | undefined;
  onCompleted?: ((completion: { deckId: DeckId; cardOrderIds: string[] }) => void) | undefined;
}

const applyOptimisticMove = (deckId: DeckId, nextIndex: number) => {
  const state = studyStore.getState();
  state.setCurrentIndex(deckId, nextIndex);
  return studyStore.getState().sessionsByDeckId[deckId];
};

type StudyState = ReturnType<typeof studyStore.getState>;
type Session = StudyState["sessionsByDeckId"][string];

const revertOptimisticUpdate = (
  deckId: DeckId,
  mutationTokenRef: { current: symbol | undefined },
  mutationToken: symbol,
  optimisticSession: Session,
  previous: { session: Session; showBackText: boolean },
  onRestoreBackText?: ((showBackText: boolean) => void) | undefined
) => {
  const current = studyStore.getState();
  const currentSession = current.sessionsByDeckId[deckId];
  const changeStillCurrent = mutationTokenRef.current === mutationToken && currentSession === optimisticSession;
  if (!changeStillCurrent) return false;

  studyStore.setState((state) => ({
    sessionsByDeckId: { ...state.sessionsByDeckId, [deckId]: previous.session },
  }));
  onRestoreBackText?.(previous.showBackText);
  return true;
};

const completeStudyIfCurrent = (
  deckId: DeckId,
  session: NonNullable<Session>,
  mutationTokenRef: { current: symbol | undefined },
  mutationToken: symbol,
  exitGenerationRef: { current: number },
  exitGeneration: number,
  onStopAutoPlay: (() => void) | undefined,
  onCompleted: ((completion: { deckId: DeckId; cardOrderIds: string[] }) => void) | undefined
) => {
  if (
    mutationTokenRef.current !== mutationToken ||
    exitGenerationRef.current !== exitGeneration ||
    studyStore.getState().sessionsByDeckId[deckId] !== session
  ) {
    return;
  }
  studyStore.getState().removeStudy(deckId);
  onStopAutoPlay?.();
  onCompleted?.({ deckId, cardOrderIds: [...session.cardOrderIds] });
};

/**
 * Runs the study swipe workflow for the study feature.
 * The sequence and its cleanup remain together so partial failures can be handled consistently.
 */
const runStudySwipe = async (
  direction: SwipeDirection,
  {
    mutationTokenRef,
    exitGenerationRef,
    deckId,
    preferences,
    cards,
    update,
    onSwipe,
    showBackText,
    onHideBackText,
    onRestoreBackText,
    onStopAutoPlay,
    onExit,
    onCompleted,
  }: StudySwipeDependencies
): Promise<void> => {
  if (mutationTokenRef.current !== undefined) return;
  const state = studyStore.getState();
  const session = state.sessionsByDeckId[deckId];
  if (session == null) return;

  const swipeAction = resolveSwipeAction(preferences.controls, direction);
  const transition = resolveStudyTransition(session.currentIndex, session.cardOrderIds.length, swipeAction);
  if (transition.type === "no-op") return;
  if (transition.type === "exit") {
    onSwipe?.(direction);
    exitGenerationRef.current += 1;
    onStopAutoPlay?.();
    onExit?.(deckId);
    return;
  }

  const cardId = session.cardOrderIds[session.currentIndex];
  const card = cardId == null ? undefined : cards.find(({ id }) => id === cardId);
  if (card == null) return;

  const previous = {
    session: { ...session },
    showBackText: showBackText ?? false,
  };

  const rollbackSwipe = onSwipe?.(direction);
  if (preferences.appearance.hideBodyWhenCardChanged) {
    onHideBackText?.();
  }

  const patch = buildStudyPatch(createStudyCard(card), swipeAction, Date.now());
  const mutationToken = Symbol();
  const exitGeneration = exitGenerationRef.current;
  mutationTokenRef.current = mutationToken;
  const optimisticSession =
    transition.type === "move"
      ? applyOptimisticMove(deckId, transition.index)
      : studyStore.getState().sessionsByDeckId[deckId];
  try {
    await update(patch);
    if (transition.type === "complete") {
      completeStudyIfCurrent(
        deckId,
        session,
        mutationTokenRef,
        mutationToken,
        exitGenerationRef,
        exitGeneration,
        onStopAutoPlay,
        onCompleted
      );
    }
  } catch {
    const reverted = revertOptimisticUpdate(
      deckId,
      mutationTokenRef,
      mutationToken,
      optimisticSession,
      previous,
      onRestoreBackText
    );
    if (reverted) rollbackSwipe?.();
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
  {
    cardMutation,
    cards = [],
    onStarted,
    onSwipe,
    showBackText,
    onHideBackText,
    onToggleBackText,
    onRestoreBackText,
    onToggleAutoPlay,
    onStopAutoPlay,
    onExit,
    onCompleted,
  }: UseStudyActionsOptions
): StudyActions => {
  const preferences = usePreferences();
  const mutationTokenRef = React.useRef<symbol | undefined>(undefined);
  const exitGenerationRef = React.useRef(0);

  /**
   * Creates a new study session from the currently filtered cards.
   * The saved UI preferences are applied before the Page is notified that the session is ready.
   */
  const start = (cards: Card[]) => {
    const cardOrderIds = buildStudySession(cards, preferences.study);
    const state = studyStore.getState();
    state.startStudy(deckId, cardOrderIds);
    onHideBackText?.();
    onStarted?.();
  };

  const restart = (cardOrderIds: string[]) => {
    studyStore.getState().startStudy(deckId, cardOrderIds);
    onHideBackText?.();
    onStopAutoPlay?.();
  };

  const exitStudy = () => {
    exitGenerationRef.current += 1;
    onStopAutoPlay?.();
    onExit?.(deckId);
  };

  /**
   * Runs the study workflow for one swipe direction.
   * Direction-specific callbacks reuse this function so pending checks, optimistic state, and
   * persistence stay identical.
   */
  const swipe = (direction: SwipeDirection) => {
    if (cardMutation == null) return Promise.resolve();
    return runStudySwipe(direction, {
      mutationTokenRef,
      exitGenerationRef,
      deckId,
      preferences,
      cards,
      update: cardMutation.update,
      onSwipe,
      showBackText,
      onHideBackText,
      onRestoreBackText,
      onStopAutoPlay,
      onExit,
      onCompleted,
    });
  };

  return {
    start,
    restart,
    exitStudy,
    swipeUp: () => swipe("cardSwipeUp"),
    swipeDown: () => swipe("cardSwipeDown"),
    swipeLeft: () => swipe("cardSwipeLeft"),
    swipeRight: () => swipe("cardSwipeRight"),
    updateIndex: (currentIndex: number) => {
      const state = studyStore.getState();
      if (state.sessionsByDeckId[deckId] == null) return;
      onHideBackText?.();
      state.setCurrentIndex(deckId, currentIndex);
    },
    toggleShowBackText: () => onToggleBackText?.(),
    toggleAutoPlay: () => onToggleAutoPlay?.(),
    resetStudy: () => studyStore.getState().removeStudy(deckId),
  };
};
