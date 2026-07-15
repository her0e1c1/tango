import React from "react";

import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import * as action from "@/action";
import * as type from "@/action/type";
import * as selector from "@/selector";
import { getLegacyStudyCandidate } from "@/features/study/hooks/useLegacyStudySession";
import { studyStore } from "@/features/study/state/studyStore";
import { buildStudyPatch, buildStudySession, calculateNextIndex, resolveSwipeAction } from "@/lib/study";

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
  const deck = useSelector(selector.deck.getById(deckId));
  const cards = useSelector(selector.card.getFilteredByDeckId(deckId));
  const cardsById = useSelector((state: RootState) => state.card.byId);
  const config = useSelector(selector.config.get());

  const start = React.useCallback(() => {
    const cardOrderIds = buildStudySession(cards, config);
    const state = studyStore.getState();
    if (getLegacyStudyCandidate(deck) != null) {
      state.markLegacyMigrated(deckId);
      dispatch(type.deckClearLegacyStudy(deckId));
    }
    state.startStudy(deckId, cardOrderIds);
    state.initializeStudyUi(config.defaultAutoPlay);
    void navigate(`/deck/${deckId}/study`, { replace: true });
  }, [cards, config, deck, deckId, dispatch, navigate]);

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
