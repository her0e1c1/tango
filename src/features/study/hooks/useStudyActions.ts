/**
 * @file Provides the study feature's Use Study Actions React hook.
 * The hook combines state and operations behind one interface so components do not need to
 * coordinate services themselves.
 */

import React from "react";

import { useNavigate } from "react-router-dom";

import { useRemoteCollections } from "@/hooks/useRemoteCollections";
import { studyStore, type StudySession } from "@/features/study/state/studyStore";
import { buildStudyPatch, buildStudySession, calculateNextIndex, resolveSwipeAction } from "@/lib/study";
import { useCardMutations } from "@/features/card/hooks/useCardMutations";
import { useConfig } from "@/hooks/useConfig";
import type { MutationLifecycle } from "@/hooks/mutationLifecycle";

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

interface StudyMutationContext {
  token: symbol;
  previous: {
    session: StudySession;
    showBackText: boolean;
    lastSwipe: SwipeDirection | undefined;
  };
  optimisticSession: StudySession | undefined;
}

interface StudySwipeDependencies {
  mutationTokenRef: { current: symbol | undefined };
  deckId: DeckId;
  config: ConfigState;
  cardsById: Partial<Record<CardId, Card>>;
  isPending: (id: CardId) => boolean;
  update: <Context = unknown>(card: CardEdit, lifecycle?: MutationLifecycle<Context>) => Promise<void>;
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

  const patch = buildStudyPatch(card, swipeAction, Date.now());
  const nextIndex = calculateNextIndex(session.currentIndex, session.cardOrderIds.length, swipeAction);
  const lifecycle: MutationLifecycle<StudyMutationContext> = {
    onMutate: () => {
      if (mutationTokenRef.current !== undefined) throw new Error("A study swipe is already running");
      const current = studyStore.getState();
      const currentSession = current.sessionsByDeckId[deckId];
      if (currentSession == null || currentSession.cardOrderIds[currentSession.currentIndex] !== card.id) {
        throw new Error("The study session changed before the swipe could be retried");
      }

      const previous = {
        session: { ...currentSession },
        showBackText: current.showBackText,
        lastSwipe: current.lastSwipe,
      };
      const token = Symbol();
      mutationTokenRef.current = token;
      current.setLastSwipe(direction);
      if (config.hideBodyWhenCardChanged) current.hideBackText();
      if (nextIndex < 0) current.removeStudy(deckId);
      else current.setCurrentIndex(deckId, nextIndex);

      return {
        token,
        previous,
        optimisticSession: studyStore.getState().sessionsByDeckId[deckId],
      };
    },
    onError: (_error, context) => {
      if (context == null) return;
      const current = studyStore.getState();
      const currentSession = current.sessionsByDeckId[deckId];
      const changeStillCurrent =
        mutationTokenRef.current === context.token &&
        (nextIndex < 0 ? currentSession == null : currentSession === context.optimisticSession);
      if (!changeStillCurrent) return;

      studyStore.setState((nextState) => ({
        sessionsByDeckId: { ...nextState.sessionsByDeckId, [deckId]: context.previous.session },
        showBackText: context.previous.showBackText,
        lastSwipe: context.previous.lastSwipe,
      }));
    },
    onSettled: (context) => {
      if (context != null && mutationTokenRef.current === context.token) mutationTokenRef.current = undefined;
    },
  };

  try {
    await update(patch, lifecycle);
  } catch {
    // The mutation notice owns error feedback and retry.
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
