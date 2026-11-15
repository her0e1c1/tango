import { getCards } from "../../../src/entities/card/model/store";
import { getDecks } from "../../../src/entities/deck/model/store";
import { getStudySession, studySessionStore } from "../../../src/entities/study-session/model/store";
import { createCard as cardFixture, createDeck as deckFixture } from "@/test/factories";
import {
  applyStudySessionResult,
  replaceRemoteCards,
  replaceRemoteDecks,
  restoreStudySession,
} from "@/test/utils/entityFixtures";
import { omitUndefined } from "@/shared/lib/omitUndefined";

export const events: { name: string; args: unknown[] }[] = [];
const now = Date.UTC(2026, 6, 1, 12);

const defaults = {
  createCard: ((uid, value) => {
    replaceRemoteCards([...getCards(), cardFixture({ ...value, uid, createdAt: now, updatedAt: now })]);
    return Promise.resolve();
  }) as typeof import("../../../src/entities/card").createCard,
  editCard: ((_uid, value) => {
    replaceRemoteCards(getCards().map((item) => (item.id === value.id ? { ...item, ...omitUndefined(value) } : item)));
    return Promise.resolve();
  }) as typeof import("../../../src/entities/card").editCard,
  deleteCard: ((_uid, id) => {
    replaceRemoteCards(getCards().filter((item) => item.id !== id));
    return Promise.resolve();
  }) as typeof import("../../../src/entities/card").deleteCard,
  createDeck: ((uid, value) => {
    replaceRemoteDecks([...getDecks(), deckFixture({ ...omitUndefined(value), uid, createdAt: now, updatedAt: now })]);
    return Promise.resolve();
  }) as typeof import("../../../src/entities/deck").createDeck,
  editDeck: ((_uid, value) => {
    replaceRemoteDecks(getDecks().map((item) => (item.id === value.id ? { ...item, ...omitUndefined(value) } : item)));
    return Promise.resolve();
  }) as typeof import("../../../src/entities/deck").editDeck,
  deleteDeck: ((_uid, id) => {
    replaceRemoteDecks(getDecks().filter((item) => item.id !== id));
    return Promise.resolve();
  }) as typeof import("../../../src/entities/deck").deleteDeck,
  startStudy: (({ deckId, cardOrderIds, uid }) => {
    const sessionId = "contract-session";
    restoreStudySession({
      sessionId,
      deckId,
      cardOrderIds: [...cardOrderIds],
      currentIndex: 0,
      lastStudiedAt: now,
      remote: { uid, startedAt: now },
    });
    return Promise.resolve(sessionId);
  }) as typeof import("../../../src/entities/study-session").startStudy,
  touchStudySession: (() =>
    Promise.resolve()) as typeof import("../../../src/entities/study-session").touchStudySession,
  setStudySessionIndex: ((deckId, index) => {
    const value = getStudySession(deckId);
    if (!value || index <= value.currentIndex || index >= value.cardOrderIds.length) return Promise.resolve(false);
    applyStudySessionResult({ ...value, currentIndex: index }, null);
    return Promise.resolve(true);
  }) as typeof import("../../../src/entities/study-session").setStudySessionIndex,
  abandonStudySession: ((deckId) => {
    const value = getStudySession(deckId);
    if (value)
      studySessionStore.setState((state) => ({
        sessionsByDeckId: Object.fromEntries(Object.entries(state.sessionsByDeckId).filter(([id]) => id !== deckId)),
      }));
    return Promise.resolve();
  }) as typeof import("../../../src/entities/study-session").abandonStudySession,
  writeStudySessionPosition: ((value, targetIndex) => {
    const completed = targetIndex === value.cardOrderIds.length;
    const result = {
      session: { ...value, currentIndex: completed ? targetIndex - 1 : targetIndex },
      endReason: completed ? ("completed" as const) : null,
    };
    applyStudySessionResult(result.session, result.endReason);
    return Promise.resolve(result);
  }) as typeof import("../../../src/entities/study-session").writeStudySessionPosition,
  writeStudyAnswer: (() => Promise.resolve()) as typeof import("../../../src/entities/study-answer").writeStudyAnswer,
  subscribeStudyAnswerHistory: ((_request, receive) => {
    receive({ records: [], source: "server", truncated: false, invalidCount: 0, hasPendingWrites: false });
    return () => undefined;
  }) as typeof import("../../../src/entities/study-answer").subscribeStudyAnswerHistory,
  signInWithGoogle: (() => {
    return Promise.reject(new Error("This scenario must supply the Google sign-in response"));
  }) as typeof import("../../../src/entities/auth").signInWithGoogle,
  signOutCurrentUser: (() => Promise.resolve()) as typeof import("../../../src/entities/auth").signOutCurrentUser,
  downloadTextFile: (() => undefined) as typeof import("../../../src/shared/files").downloadTextFile,
};
export const io = { ...defaults };
export function resetIO() {
  Object.assign(io, defaults);
  events.length = 0;
}
