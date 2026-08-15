/**
 * @file Provides the study feature's Use Study Actions React hook.
 * The hook combines state and operations behind one interface so components do not need to
 * coordinate services themselves.
 */

import type { Card, CardId } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import type { StudyProgressEdit } from "@/entities/study-progress";
import type { Preferences, SwipeDirection } from "@/entities/preferences";

import React from "react";

import { buildStudySession, calculateNextIndex } from "../model/session";
import { createStudyCard } from "../model/studyCard";
import { buildStudyPatch, resolveSwipeAction } from "../model/swipe";
import { studyStore } from "../state/studyStoreInstance";
import { usePreferences } from "@/entities/preferences";

export interface StudyActions {
  start: (cards: Card[]) => void;
  swipeUp: () => Promise<void>;
  swipeDown: () => Promise<void>;
  swipeLeft: () => Promise<void>;
  swipeRight: () => Promise<void>;
  updateIndex: (currentIndex: number) => void;
  toggleShowBackText: () => void;
  resetStudy: () => void;
}

interface StudyCardMutation {
  update: (progress: StudyProgressEdit) => Promise<void>;
}

interface UseStudyActionsOptions {
  cardsById: Partial<Record<CardId, Card>>;
  cardMutation?: StudyCardMutation | undefined;
  onStarted?: (() => void) | undefined;
  onSwipe?: ((direction: SwipeDirection) => void) | undefined;
  showBackText?: boolean | undefined;
  onHideBackText?: (() => void) | undefined;
  onToggleBackText?: (() => void) | undefined;
  onRestoreBackText?: ((showBackText: boolean) => void) | undefined;
}

interface StudySwipeDependencies {
  mutationTokenRef: { current: symbol | undefined };
  deckId: DeckId;
  preferences: Preferences;
  cardsById: Partial<Record<CardId, Card>>;
  update: (progress: StudyProgressEdit) => Promise<void>;
  onSwipe?: ((direction: SwipeDirection) => void) | undefined;
  showBackText?: boolean | undefined;
  onHideBackText?: (() => void) | undefined;
  onRestoreBackText?: ((showBackText: boolean) => void) | undefined;
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
  previous: { session: Session; showBackText: boolean },
  onRestoreBackText?: ((showBackText: boolean) => void) | undefined
) => {
  const current = studyStore.getState();
  const currentSession = current.sessionsByDeckId[deckId];
  const changeStillCurrent =
    mutationTokenRef.current === mutationToken &&
    (nextIndex < 0 ? currentSession == null : currentSession === optimisticSession);
  if (changeStillCurrent) {
    studyStore.setState((state) => ({
      sessionsByDeckId: { ...state.sessionsByDeckId, [deckId]: previous.session },
    }));
    onRestoreBackText?.(previous.showBackText);
  }
};

/**
 * Runs the study swipe workflow for the study feature.
 * The sequence and its cleanup remain together so partial failures can be handled consistently.
 */
const runStudySwipe = async (
  direction: SwipeDirection,
  {
    mutationTokenRef,
    deckId,
    preferences,
    cardsById,
    update,
    onSwipe,
    showBackText,
    onHideBackText,
    onRestoreBackText,
  }: StudySwipeDependencies
): Promise<void> => {
  if (mutationTokenRef.current !== undefined) return;
  const state = studyStore.getState();
  const session = state.sessionsByDeckId[deckId];
  if (session == null) return;

  const swipeAction = resolveSwipeAction(preferences.controls, direction);
  if (swipeAction === "DoNothing") return;

  if (swipeAction === "GoBack") {
    onSwipe?.(direction);
    state.removeStudy(deckId);
    return;
  }

  const cardId = session.cardOrderIds[session.currentIndex];
  const card = cardId == null ? undefined : cardsById[cardId];
  if (card == null) return;

  const previous = {
    session: { ...session },
    showBackText: showBackText ?? false,
  };

  onSwipe?.(direction);
  if (preferences.appearance.hideBodyWhenCardChanged) {
    onHideBackText?.();
  }

  const patch = buildStudyPatch(createStudyCard(card), swipeAction, Date.now());
  const nextIndex = calculateNextIndex(session.currentIndex, session.cardOrderIds.length, swipeAction);
  const mutationToken = Symbol();
  mutationTokenRef.current = mutationToken;
  const optimisticSession = applyOptimisticUpdate(deckId, nextIndex);
  try {
    await update(patch);
  } catch {
    revertOptimisticUpdate(
      deckId,
      nextIndex,
      mutationTokenRef,
      mutationToken,
      optimisticSession,
      previous,
      onRestoreBackText
    );
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
    cardsById,
    onStarted,
    onSwipe,
    showBackText,
    onHideBackText,
    onToggleBackText,
    onRestoreBackText,
  }: UseStudyActionsOptions
): StudyActions => {
  const preferences = usePreferences();
  const mutationTokenRef = React.useRef<symbol | undefined>(undefined);

  /** Creates a new persisted study session from the currently filtered cards. */
  const start = (cards: Card[]) => {
    const cardOrderIds = buildStudySession(cards, preferences.study);
    studyStore.getState().startStudy(deckId, cardOrderIds);
    onHideBackText?.();
    onStarted?.();
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
      deckId,
      preferences,
      cardsById,
      update: cardMutation.update,
      onSwipe,
      showBackText,
      onHideBackText,
      onRestoreBackText,
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
      onHideBackText?.();
      state.setCurrentIndex(deckId, currentIndex);
    },
    toggleShowBackText: () => onToggleBackText?.(),
    resetStudy: () => studyStore.getState().removeStudy(deckId),
  };
};
