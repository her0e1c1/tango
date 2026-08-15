/**
 * @file Provides the study feature's Use Study Actions React hook.
 * The hook combines state and operations behind one interface so components do not need to
 * coordinate services themselves.
 */

import type { DeckId } from "@/entities/deck";
import type { Preferences, SwipeDirection } from "@/entities/preferences";
import { usePreferences } from "@/entities/preferences";
import type { StudyProgressEdit } from "@/entities/study-progress";
import {
  getStudySession,
  removeStudySession,
  restoreStudySession,
  setStudySessionIndex,
  type StudySession,
} from "@/entities/study-session";

import React from "react";

import { calculateNextIndex } from "../model/session";
import type { StudyCard } from "../model/studyCard";
import { buildStudyPatch, resolveSwipeAction } from "../model/swipe";

export interface StudyActions {
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
  cards?: readonly StudyCard[] | undefined;
  cardMutation?: StudyCardMutation | undefined;
  onSwipe?: ((direction: SwipeDirection) => SwipeRollback | undefined) | undefined;
  showBackText?: boolean | undefined;
  onHideBackText?: (() => void) | undefined;
  onToggleBackText?: (() => void) | undefined;
  onRestoreBackText?: ((showBackText: boolean) => void) | undefined;
  onToggleAutoPlay?: (() => void) | undefined;
}

interface StudySwipeDependencies {
  mutationTokenRef: { current: symbol | undefined };
  deckId: DeckId;
  preferences: Preferences;
  cards: readonly StudyCard[];
  update: (progress: StudyProgressEdit) => Promise<void>;
  onSwipe?: ((direction: SwipeDirection) => SwipeRollback | undefined) | undefined;
  showBackText?: boolean | undefined;
  onHideBackText?: (() => void) | undefined;
  onRestoreBackText?: ((showBackText: boolean) => void) | undefined;
}

const applyOptimisticUpdate = (deckId: DeckId, nextIndex: number) => {
  if (nextIndex < 0) removeStudySession(deckId);
  else setStudySessionIndex(deckId, nextIndex);
  return getStudySession(deckId);
};

const revertOptimisticUpdate = (
  deckId: DeckId,
  mutationTokenRef: { current: symbol | undefined },
  mutationToken: symbol,
  optimisticSession: StudySession | undefined,
  previous: { session: StudySession; showBackText: boolean },
  onRestoreBackText?: ((showBackText: boolean) => void) | undefined
) => {
  const changeStillCurrent =
    mutationTokenRef.current === mutationToken && restoreStudySession(deckId, optimisticSession, previous.session);
  if (!changeStillCurrent) return false;

  onRestoreBackText?.(previous.showBackText);
  return true;
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
    cards,
    update,
    onSwipe,
    showBackText,
    onHideBackText,
    onRestoreBackText,
  }: StudySwipeDependencies
): Promise<void> => {
  if (mutationTokenRef.current !== undefined) return;
  const session = getStudySession(deckId);
  if (session == null) return;

  const swipeAction = resolveSwipeAction(preferences.controls, direction);
  if (swipeAction === "DoNothing") return;

  if (swipeAction === "GoBack") {
    onSwipe?.(direction);
    removeStudySession(deckId);
    return;
  }

  const cardId = session.cardOrderIds[session.currentIndex];
  const studyCard = cardId == null ? undefined : cards.find(({ card }) => card.id === cardId);
  if (studyCard == null) return;

  const previous = {
    session: { ...session },
    showBackText: showBackText ?? false,
  };

  const rollbackSwipe = onSwipe?.(direction);
  if (preferences.appearance.hideBodyWhenCardChanged) {
    onHideBackText?.();
  }

  const patch = buildStudyPatch(studyCard, swipeAction, Date.now());
  const nextIndex = calculateNextIndex(session.currentIndex, session.cardOrderIds.length, swipeAction);
  const mutationToken = Symbol();
  mutationTokenRef.current = mutationToken;
  const optimisticSession = applyOptimisticUpdate(deckId, nextIndex);
  try {
    await update(patch);
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
    onSwipe,
    showBackText,
    onHideBackText,
    onToggleBackText,
    onRestoreBackText,
    onToggleAutoPlay,
  }: UseStudyActionsOptions
): StudyActions => {
  const preferences = usePreferences();
  const mutationTokenRef = React.useRef<symbol | undefined>(undefined);

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
      cards,
      update: cardMutation.update,
      onSwipe,
      showBackText,
      onHideBackText,
      onRestoreBackText,
    });
  };

  return {
    swipeUp: () => swipe("cardSwipeUp"),
    swipeDown: () => swipe("cardSwipeDown"),
    swipeLeft: () => swipe("cardSwipeLeft"),
    swipeRight: () => swipe("cardSwipeRight"),
    updateIndex: (currentIndex: number) => {
      if (getStudySession(deckId) == null) return;
      onHideBackText?.();
      setStudySessionIndex(deckId, currentIndex);
    },
    toggleShowBackText: () => onToggleBackText?.(),
    toggleAutoPlay: () => onToggleAutoPlay?.(),
    resetStudy: () => removeStudySession(deckId),
  };
};
