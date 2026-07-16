import React from "react";

import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { useRemoteCollections } from "@/query/useRemoteCollections";
import { studyStore } from "@/features/study/state/studyStore";
import { buildStudyPatch, buildStudySession, calculateNextIndex, resolveSwipeAction } from "@/lib/study";
import { useCardMutations } from "@/features/card/hooks/useCardMutations";

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

export const useStudyActions = (deckId: DeckId): StudyActions => {
  const navigate = useNavigate();
  const config = useSelector((state: RootState) => state.config);
  const remote = useRemoteCollections();
  const cards = remote.filteredCardsByDeckId(deckId, config);
  const cardsById = remote.cardsById;
  const cardMutations = useCardMutations();

  const start = React.useCallback(() => {
    const cardOrderIds = buildStudySession(cards, config);
    const state = studyStore.getState();
    state.startStudy(deckId, cardOrderIds);
    state.initializeStudyUi(config.defaultAutoPlay);
    void navigate(`/deck/${deckId}/study`, { replace: true });
  }, [cards, config, deckId, navigate]);

  const swipe = React.useCallback(
    async (direction: SwipeDirection): Promise<void> => {
      const state = studyStore.getState();
      const session = state.session;
      if (session == null || session.deckId !== deckId) return;

      const swipeAction = resolveSwipeAction(config, direction);
      if (swipeAction === "DoNothing") return;

      if (swipeAction === "GoBack") {
        state.setLastSwipe(direction);
        state.setCurrentIndex(-1);
        return;
      }

      const cardId = session.cardOrderIds[session.currentIndex];
      const card = cardId == null ? undefined : cardsById[cardId];
      if (card == null || cardMutations.isPending(card.id)) return;

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
      state.setCurrentIndex(nextIndex);
      try {
        await cardMutations.update(patch);
      } catch {
        const current = studyStore.getState();
        if (current.session?.deckId === deckId && current.session.currentIndex === nextIndex) {
          studyStore.setState(previous);
        }
      }
    },
    [cardMutations, cardsById, config, deckId]
  );

  return React.useMemo(
    () => ({
      start,
      swipeUp: () => swipe("cardSwipeUp"),
      swipeDown: () => swipe("cardSwipeDown"),
      swipeLeft: () => swipe("cardSwipeLeft"),
      swipeRight: () => swipe("cardSwipeRight"),
      updateIndex: (currentIndex: number) => {
        const state = studyStore.getState();
        if (state.session?.deckId !== deckId) return;
        state.hideBackText();
        state.setCurrentIndex(currentIndex);
      },
      toggleShowBackText: () => studyStore.getState().toggleShowBackText(),
      toggleAutoPlay: () => studyStore.getState().toggleAutoPlay(),
      resetStudy: () => studyStore.getState().resetStudy(),
      pending: cardMutations.pending,
      error: cardMutations.error,
      retry: cardMutations.retry,
    }),
    [cardMutations.error, cardMutations.pending, cardMutations.retry, deckId, start, swipe]
  );
};
