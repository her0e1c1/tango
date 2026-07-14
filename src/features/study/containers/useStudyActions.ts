import React from "react";

import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import * as action from "@src/action";
import * as selector from "@src/selector";
import { studyStore } from "@src/features/study/state/studyStore";
import { buildStudyPatch, buildStudySession, calculateNextIndex, resolveSwipeAction } from "@src/lib/study";

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
}

export const useStudyActions = (deckId: DeckId): StudyActions => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cards = useSelector(selector.card.getFilteredByDeckId(deckId));
  const cardsById = useSelector((state: RootState) => state.card.byId);
  const config = useSelector(selector.config.get());

  const start = React.useCallback(() => {
    const cardOrderIds = buildStudySession(cards, config);
    const state = studyStore.getState();
    state.startStudy(deckId, cardOrderIds);
    state.initializeStudyUi(config.defaultAutoPlay);
    navigate(`/deck/${deckId}/study`, { replace: true });
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
      if (card == null) return;

      state.setLastSwipe(direction);
      if (config.hideBodyWhenCardChanged) {
        state.hideBackText();
      }

      const patch = buildStudyPatch(card, swipeAction, Date.now());
      await dispatch(action.card.update(patch));

      const current = studyStore.getState();
      if (current.session?.deckId === deckId) {
        current.setCurrentIndex(calculateNextIndex(session.currentIndex, session.cardOrderIds.length, swipeAction));
      }
    },
    [cardsById, config, deckId, dispatch]
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
    }),
    [deckId, start, swipe]
  );
};
