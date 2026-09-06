import * as React from "react";
import type { DeckId } from "@/entities/deck";
import { maintainStudySession } from "./actions/maintainStudySession";
import type { StudySessionState } from "./types";

export const useStudySessionLifecycle = (deckId: DeckId, status: StudySessionState["status"]): void => {
  React.useEffect(() => maintainStudySession(deckId, status), [deckId, status]);
};
