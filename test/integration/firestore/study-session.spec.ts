import "@/test/initializeTestFirestore";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deleteApp, getApps } from "firebase/app";
import {
  collection,
  disableNetwork,
  doc,
  enableNetwork,
  getDoc,
  getDocFromCache,
  getDocs,
  query,
  setDoc,
  Timestamp,
  waitForPendingWrites,
  where,
} from "firebase/firestore";
import { replaceAuthSession } from "@/entities/auth";
import { cardStore } from "@/entities/card/model/store";
import { deckStore } from "@/entities/deck/model/store";
import { preferencesStore } from "@/entities/preference/model/store";
import {
  abandonStudySession,
  clearStudySessions,
  getStudySession,
  moveStudySession,
  setStudySessionIndex,
  startStudy,
  subscribeStudySessions,
  touchStudySession,
} from "@/entities/study-session";
import { updateStudySession } from "@/entities/study-session/api/firestore";
import type { StudySession } from "@/entities/study-session/model/types";
import { startStudySession } from "@/pages/study-session-start/model/actions/startStudySession";
import { createCard, createDeck, createPreferences } from "@/test/factories";
import { testDb } from "@/test/initializeTestFirestore";

vi.mock("@/shared/firebase", async () => ({
  db: (await import("@/test/initializeTestFirestore")).testDb,
  auth: { currentUser: { uid: "uid" } },
}));

const cards = ["first", "second", "third"].map((id, numberOfSeen) => ({ id, numberOfSeen, difficulty: 5 }));
const waitForCloud = (assertion: () => void | Promise<void>) => vi.waitFor(assertion, { timeout: 10_000 });
const preferences = { shuffled: false, maxNumberOfCardsToLearn: 0 };
const readSession = (sessionId: string) => getDoc(doc(testDb, "studySession", sessionId));

describe("StudySession cloud lifecycle", () => {
  let stop: (() => void) | undefined;
  let deckId: string;

  beforeEach(() => {
    clearStudySessions();
    cardStore.setState({ remoteCards: [] });
    deckStore.setState({ remoteDecks: [] });
    preferencesStore.setState({ preferences: createPreferences({ study: preferences }) });
    replaceAuthSession({ status: "authenticated", uid: "uid", isAnonymous: false, displayName: null });
    deckId = crypto.randomUUID();
  });
  afterEach(async () => {
    stop?.();
    stop = undefined;
    await disableNetwork(testDb);
    await enableNetwork(testDb);
    await waitForPendingWrites(testDb);
    clearStudySessions();
    cardStore.setState({ remoteCards: [] });
    deckStore.setState({ remoteDecks: [] });
    vi.restoreAllMocks();
  });
  afterAll(async () => {
    await Promise.all(getApps().map(deleteApp));
  });

  async function startRemote(): Promise<StudySession> {
    await startStudy({ deckId, cards, preferences, uid: "uid" });
    const session = getStudySession(deckId);
    if (session === undefined) throw new Error("Expected a session");
    return session;
  }

  it("[FIRESTORE-STUDY-SESSION-01] restores saved order and cursor after resubscribing", async () => {
    const onError = vi.fn();
    stop = subscribeStudySessions("uid", onError);
    const started = await startRemote();
    await setStudySessionIndex(deckId, 1);
    await waitForPendingWrites(testDb);
    expect((await readSession(started.sessionId)).data()).toEqual({
      uid: "uid",
      deckId,
      cardOrderIds: ["first", "second", "third"],
      currentIndex: 1,
      startedAt: Timestamp.fromMillis(started.remote.startedAt),
      endedAt: null,
      endReason: null,
      createdAt: expect.any(Timestamp),
      updatedAt: expect.any(Timestamp),
    });
    stop();
    clearStudySessions();
    stop = subscribeStudySessions("uid", onError);
    await waitForCloud(() =>
      expect(getStudySession(deckId)).toMatchObject({
        sessionId: started.sessionId,
        cardOrderIds: cards.map(({ id }) => id),
        currentIndex: 1,
      })
    );
    expect(getStudySession(deckId)?.lastStudiedAt).toBeGreaterThan(0);
    await touchStudySession(deckId);
    const lastStudiedAt = getStudySession(deckId)?.lastStudiedAt;
    expect(lastStudiedAt).toBeGreaterThan(0);
    await updateStudySession({ ...started, currentIndex: 2 }, null);
    await waitForCloud(() => expect(getStudySession(deckId)?.currentIndex).toBe(2));
    expect(getStudySession(deckId)?.lastStudiedAt).toBeGreaterThanOrEqual(lastStudiedAt ?? 0);
    expect(onError).not.toHaveBeenCalled();
  });

  it("[FIRESTORE-STUDY-SESSION-02] abandons the previous session only on explicit restart", async () => {
    stop = subscribeStudySessions("uid", vi.fn());
    const previous = await startRemote();
    await setStudySessionIndex(deckId, 1);
    await waitForPendingWrites(testDb);
    stop();
    expect((await readSession(previous.sessionId)).data()?.endReason).toBeNull();
    stop = subscribeStudySessions("uid", vi.fn());
    const next = await startRemote();
    await waitForPendingWrites(testDb);
    expect((await readSession(previous.sessionId)).data()).toMatchObject({
      endReason: "abandoned",
      endedAt: expect.any(Timestamp),
    });
    expect((await readSession(next.sessionId)).data()).toMatchObject({ currentIndex: 0, endReason: null });
    expect(next.sessionId).not.toBe(previous.sessionId);
    // A delayed application position update does not reopen an ended run.
    await updateStudySession({ ...previous, currentIndex: 1 }, null);
    await waitForPendingWrites(testDb);
    expect((await readSession(previous.sessionId)).data()?.endReason).toBe("abandoned");
  });

  it("[FIRESTORE-STUDY-SESSION-03] completes the final Card once and preserves lifecycle metadata", async () => {
    stop = subscribeStudySessions("uid", vi.fn());
    const started = await startRemote();
    await waitForPendingWrites(testDb);
    const original = (await readSession(started.sessionId)).data();
    await setStudySessionIndex(deckId, 2);
    const final = getStudySession(deckId);
    if (final === undefined) throw new Error("Expected the final Card");
    expect(await moveStudySession(final)).toBe(true);
    await waitForPendingWrites(testDb);
    expect(await moveStudySession(final)).toBe(false);
    expect(getStudySession(deckId)).toBeUndefined();
    expect((await readSession(started.sessionId)).data()).toMatchObject({
      currentIndex: 2,
      endReason: "completed",
      endedAt: expect.any(Timestamp),
      createdAt: original?.createdAt,
      startedAt: original?.startedAt,
    });
  });

  it("[FIRESTORE-STUDY-SESSION-04] syncs offline creation, progress and abandonment", async () => {
    stop = subscribeStudySessions("uid", vi.fn());
    await disableNetwork(testDb);
    const session = await startRemote();
    await setStudySessionIndex(deckId, 1);
    await abandonStudySession(deckId);
    stop();
    expect((await getDocFromCache(doc(testDb, "studySession", session.sessionId))).data()).toMatchObject({
      currentIndex: 1,
      endReason: "abandoned",
    });
    clearStudySessions();
    await enableNetwork(testDb);
    await waitForPendingWrites(testDb);
    expect((await readSession(session.sessionId)).data()).toMatchObject({ currentIndex: 1, endReason: "abandoned" });
    const documents = await getDocs(query(collection(testDb, "studySession"), where("uid", "==", "uid")));
    expect(documents.docs.filter((item) => item.data().deckId === deckId).map(({ id }) => id)).toEqual([
      session.sessionId,
    ]);
  });

  it("[FIRESTORE-STUDY-SESSION-05] restarts offline while another Deck has pending writes", async () => {
    stop = subscribeStudySessions("uid", vi.fn());
    const deck = createDeck({ id: deckId, uid: "uid" });
    const otherDeck = createDeck({ id: crypto.randomUUID(), uid: "uid" });
    const otherCards = cards.map((card) =>
      createCard({ ...card, uid: "uid", id: `other-${card.id}`, deckId: otherDeck.id })
    );
    deckStore.setState({ remoteDecks: [deck, otherDeck] });
    cardStore.setState({
      remoteCards: [...cards.map((card) => createCard({ ...card, uid: "uid", deckId })), ...otherCards],
    });
    expect(await startStudySession(deck.id, deck)).toBe(true);
    await setStudySessionIndex(deckId, 1);
    await waitForPendingWrites(testDb);
    const previous = getStudySession(deckId);
    stop();
    await disableNetwork(testDb);
    clearStudySessions();
    expect(getStudySession(deckId)).toBeUndefined();
    stop = subscribeStudySessions("uid", vi.fn());
    await vi.waitFor(() => expect(getStudySession(deckId)?.currentIndex).toBe(previous?.currentIndex));
    expect(await startStudySession(otherDeck.id, otherDeck)).toBe(true);
    expect(getStudySession(otherDeck.id)?.cardOrderIds).toEqual(otherCards.map(({ id }) => id));
    expect(await startStudySession(deck.id, deck)).toBe(true);
    const restarted = getStudySession(deckId);
    expect(restarted?.sessionId).not.toBe(previous?.sessionId);
    expect(restarted?.currentIndex).toBe(0);
    await enableNetwork(testDb);
    await waitForPendingWrites(testDb);
    expect((await readSession(restarted?.sessionId ?? "missing")).data()?.endReason).toBeNull();
    expect((await readSession(previous?.sessionId ?? "missing")).data()?.endReason).toBe("abandoned");
  });

  it("[FIRESTORE-STUDY-SESSION-06] ignores malformed documents without blocking study", async () => {
    stop = subscribeStudySessions("uid", vi.fn());
    const valid = await startRemote();
    await waitForPendingWrites(testDb);
    await setDoc(doc(testDb, "studySession", crypto.randomUUID()), { uid: "uid", answers: [] });
    stop();
    clearStudySessions();
    const onError = vi.fn();
    stop = subscribeStudySessions("uid", onError);
    await waitForCloud(() => expect(getStudySession(deckId)?.sessionId).toBe(valid.sessionId));
    const next = await startRemote();
    await waitForPendingWrites(testDb);
    expect((await readSession(next.sessionId)).data()?.endReason).toBeNull();
    expect(onError).not.toHaveBeenCalled();
  });
});
