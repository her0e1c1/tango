import React from "react";

import { useDispatch } from "react-redux";

import * as type from "@src/action/type";
import { useStudyStore } from "@src/features/study/hooks/useStudyStore";
import { type LegacyStudyCandidate, type LegacyStudyFields } from "@src/features/study/state/studyStore";

export const getLegacyStudyCandidate = (deck: Deck): LegacyStudyCandidate | undefined => {
  const legacyDeck = deck as Deck & Partial<LegacyStudyFields>;
  if (
    !Array.isArray(legacyDeck.cardOrderIds) ||
    legacyDeck.cardOrderIds.length === 0 ||
    !legacyDeck.cardOrderIds.every((cardId) => typeof cardId === "string") ||
    typeof legacyDeck.currentIndex !== "number"
  ) {
    return undefined;
  }
  return {
    id: deck.id,
    cardOrderIds: legacyDeck.cardOrderIds,
    currentIndex: legacyDeck.currentIndex,
  };
};

export const useLegacyStudySession = (routeDeckId: DeckId, candidate?: LegacyStudyCandidate): void => {
  const dispatch = useDispatch();
  const importLegacyStudy = useStudyStore((state) => state.importLegacyStudy);

  React.useEffect(() => {
    if (importLegacyStudy(routeDeckId, candidate)) {
      dispatch(type.deckClearLegacyStudy(routeDeckId));
    }
  }, [candidate, dispatch, importLegacyStudy, routeDeckId]);
};
