import React from "react";

import { useDispatch } from "react-redux";

import * as type from "@src/action/type";
import { type LegacyStudyCandidate, useStudyStore } from "@src/features/study/state/studyStore";

export const useLegacyStudySession = (routeDeckId: DeckId, candidate?: LegacyStudyCandidate): void => {
  const dispatch = useDispatch();
  const importLegacyStudy = useStudyStore((state) => state.importLegacyStudy);

  React.useEffect(() => {
    if (importLegacyStudy(routeDeckId, candidate)) {
      dispatch(type.deckClearLegacyStudy(routeDeckId));
    }
  }, [candidate, dispatch, importLegacyStudy, routeDeckId]);
};
