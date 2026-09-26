import { cardStore } from "@/entities/card/model/store";
import type { RemoteCard } from "@/entities/card/model/types";
import { deckStore } from "@/entities/deck/model/store";
import type { Deck } from "@/entities/deck";
import { preferencesSchema } from "@/entities/preference/model/schema";
import { preferencesStore } from "@/entities/preference/model/store";
import type { PartialPreferences } from "@/entities/preference/model/types";

export type PreferencesFixture = PartialPreferences;

export const replaceRemoteCards = (remoteCards: RemoteCard[]): void => {
  cardStore.setState({ remoteCards });
};

export const replaceRemoteDecks = (remoteDecks: Deck[]): void => {
  deckStore.setState({ remoteDecks });
};

export const replacePreferences = (input: PartialPreferences): void => {
  const preferences = preferencesSchema.parse(input);
  preferencesStore.setState({
    preferences: {
      ...preferences,
      study: {
        ...preferences.study,
        selectedTags: [...preferences.study.selectedTags],
      },
    },
  });
};

import { buildStudyCardOrder } from "@/pages/study-session-start/model/queries/buildStudyCardOrder";
import type { StudySession } from "@/entities/study-session";
import { studySessionStore } from "@/entities/study-session/model/store";

export function restoreStudySession(session: StudySession): void {
  studySessionStore.setState((state) => ({
    sessionsByDeckId: { ...state.sessionsByDeckId, [session.deckId]: session },
  }));
}

export function startStudy(
  deckId: string,
  cards: { id: string }[],
  preferences: Parameters<typeof buildStudyCardOrder>[1] & { now?: number },
  uid: string
): void {
  const now = preferences.now ?? Date.now();
  restoreStudySession({
    sessionId: crypto.randomUUID(),
    deckId,
    cardOrderIds: buildStudyCardOrder(
      cards.map((card) => ({ ...card, fsrs: null })),
      preferences,
      now
    ),
    currentIndex: 0,
    lastStudiedAt: now,
    remote: { uid, startedAt: now },
  });
}
