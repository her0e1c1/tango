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
import { createStudySession, updateStudySession } from "@/entities/study-session/api/firestore";
import { studySessionStore } from "@/entities/study-session/model/store";
import type { StudySession } from "@/entities/study-session/model/types";
import { startStudySession } from "@/pages/study-session-start/model/actions/startStudySession";
import { createCard, createDeck, createPreferences } from "@/test/factories";
import { testDb } from "@/test/initializeTestFirestore";

vi.mock("@/shared/firebase", async () => ({ db: (await import("@/test/initializeTestFirestore")).testDb }));

const cards = ["first", "second", "third"].map((id, numberOfSeen) => ({ id, numberOfSeen, difficulty: 5 }));
const waitForCloud = (assertion: () => void | Promise<void>) => vi.waitFor(assertion, { timeout: 10_000 });
const preferences = { shuffled: false, maxNumberOfCardsToLearn: 0 };
const readSession = (sessionId: string) => getDoc(doc(testDb, "studySession", sessionId));

describe("StudySession cloud lifecycle [SWIPE-06] [SWIPE-08] [SWIPE-09] [SWIPE-10] [SWIPE-17] [PERSIST-02]", () => {
  let stop: (() => void) | undefined;
  let deckId: string;

  beforeEach(() => {
    clearStudySessions();
    cardStore.setState({ remoteCards: [], localCards: [] });
    deckStore.setState({ remoteDecks: [], localDecks: [] });
    preferencesStore.setState({ preferences: createPreferences({ study: preferences }) });
    replaceAuthSession({ status: "authenticated", uid: "uid", isAnonymous: false, displayName: null });
    deckId = crypto.randomUUID();
  });
  afterEach(async () => {
    stop?.();
    stop = undefined;
    await enableNetwork(testDb);
    await waitForPendingWrites(testDb);
    clearStudySessions();
    cardStore.setState({ remoteCards: [], localCards: [] });
    deckStore.setState({ remoteDecks: [], localDecks: [] });
    vi.restoreAllMocks();
  });
  afterAll(async () => {
    await Promise.all(getApps().map(deleteApp));
  });

  function startRemote(): StudySession {
    startStudy(deckId, cards, preferences, "uid");
    const session = getStudySession(deckId);
    if (session === undefined) throw new Error("Expected a session");
    return session;
  }

  it("saves the fixed order and cursor without answers and restores it on a fresh client", async () => {
    const onError = vi.fn();
    stop = subscribeStudySessions("uid", onError);
    const started = startRemote();
    setStudySessionIndex(deckId, 1);
    await waitForPendingWrites(testDb);
    expect((await readSession(started.sessionId)).data()).toEqual({
      uid: "uid",
      deckId,
      cardOrderIds: ["first", "second", "third"],
      currentIndex: 1,
      startedAt: Timestamp.fromMillis(started.remote?.startedAt ?? 0),
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
    expect(getStudySession(deckId)?.lastStudiedAt).toBe(0);
    touchStudySession(deckId);
    const lastStudiedAt = getStudySession(deckId)?.lastStudiedAt;
    expect(lastStudiedAt).toBeGreaterThan(0);
    await updateStudySession({ ...started, currentIndex: 2 }, null);
    await waitForCloud(() => expect(getStudySession(deckId)?.currentIndex).toBe(2));
    expect(getStudySession(deckId)?.lastStudiedAt).toBe(lastStudiedAt);
    expect(onError).not.toHaveBeenCalled();
  });

  it("keeps a departed session active and abandons the known session only on explicit restart", async () => {
    stop = subscribeStudySessions("uid", vi.fn());
    const previous = startRemote();
    setStudySessionIndex(deckId, 1);
    await waitForPendingWrites(testDb);
    stop();
    expect((await readSession(previous.sessionId)).data()?.endReason).toBeNull();
    const next = startRemote();
    await waitForPendingWrites(testDb);
    expect((await readSession(previous.sessionId)).data()).toMatchObject({
      endReason: "abandoned",
      endedAt: expect.any(Timestamp),
    });
    expect((await readSession(next.sessionId)).data()).toMatchObject({ currentIndex: 0, endReason: null });
    expect(next.sessionId).not.toBe(previous.sessionId);
    // Ended sessions reject late writes as well as attempts to reopen them.
    await expect(updateStudySession({ ...previous, currentIndex: 1 }, null)).rejects.toBeDefined();
    expect((await readSession(previous.sessionId)).data()?.endReason).toBe("abandoned");
  });

  it("completes the final Card once and preserves lifecycle metadata", async () => {
    const started = startRemote();
    await waitForPendingWrites(testDb);
    const original = (await readSession(started.sessionId)).data();
    setStudySessionIndex(deckId, 2);
    const final = getStudySession(deckId);
    if (final === undefined) throw new Error("Expected the final Card");
    expect(moveStudySession(final)).toBe(true);
    await waitForPendingWrites(testDb);
    expect(moveStudySession(final)).toBe(false);
    expect(getStudySession(deckId)).toBeUndefined();
    expect((await readSession(started.sessionId)).data()).toMatchObject({
      currentIndex: 2,
      endReason: "completed",
      endedAt: expect.any(Timestamp),
      createdAt: original?.createdAt,
      startedAt: original?.startedAt,
    });
  });

  it("uses the SDK offline queue for creation, progress and abandonment after leaving", async () => {
    stop = subscribeStudySessions("uid", vi.fn());
    await disableNetwork(testDb);
    const session = startRemote();
    setStudySessionIndex(deckId, 1);
    abandonStudySession(deckId);
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

  it("starts and restarts after offline rehydration while another Deck has pending writes", async () => {
    stop = subscribeStudySessions("uid", vi.fn());
    const deck = createDeck({ id: deckId });
    const otherDeck = createDeck({ id: crypto.randomUUID() });
    const otherCards = cards.map((card) => createCard({ ...card, id: `other-${card.id}`, deckId: otherDeck.id }));
    deckStore.setState({ remoteDecks: [deck, otherDeck] });
    cardStore.setState({ remoteCards: [...cards.map((card) => createCard({ ...card, deckId })), ...otherCards] });
    expect(startStudySession(deck.id, deck)).toBe(true);
    setStudySessionIndex(deckId, 1);
    await waitForPendingWrites(testDb);
    const previous = getStudySession(deckId);
    stop();
    await disableNetwork(testDb);
    const storageKey = studySessionStore.persist.getOptions().name;
    if (storageKey === undefined) throw new Error("Expected a storage key");
    const persisted = localStorage.getItem(storageKey);
    if (persisted === null) throw new Error("Expected a persisted study session");
    clearStudySessions();
    expect(getStudySession(deckId)).toBeUndefined();
    localStorage.setItem(storageKey, persisted);
    await studySessionStore.persist.rehydrate();
    stop = subscribeStudySessions("uid", vi.fn());
    expect(getStudySession(deckId)).toEqual(previous);
    expect(startStudySession(otherDeck.id, otherDeck)).toBe(true);
    expect(getStudySession(otherDeck.id)?.cardOrderIds).toEqual(otherCards.map(({ id }) => id));
    expect(startStudySession(deck.id, deck)).toBe(true);
    const restarted = getStudySession(deckId);
    expect(restarted?.sessionId).not.toBe(previous?.sessionId);
    expect(restarted?.currentIndex).toBe(0);
    await enableNetwork(testDb);
    await waitForPendingWrites(testDb);
    expect((await readSession(restarted?.sessionId ?? "missing")).data()?.endReason).toBeNull();
    expect((await readSession(previous?.sessionId ?? "missing")).data()?.endReason).toBe("abandoned");
  });

  it("never uploads a local-only session while cloud synchronization is running", async () => {
    stop = subscribeStudySessions("uid", vi.fn());
    startStudy(deckId, cards, preferences);
    const session = getStudySession(deckId);
    if (session === undefined) throw new Error("Expected a local session");
    setStudySessionIndex(deckId, 1);
    await expect(createStudySession(session)).rejects.toThrow("local");
    const documents = await getDocs(query(collection(testDb, "studySession"), where("uid", "==", "uid")));
    expect(documents.docs.some(({ id }) => id === session.sessionId)).toBe(false);
    expect(getStudySession(deckId)?.currentIndex).toBe(1);
  });

  it("selects the newest server-created run without abandoning other runs", async () => {
    const clock = vi.spyOn(Date, "now").mockReturnValue(Date.now() + 86_400_000);
    const old = startRemote();
    await waitForPendingWrites(testDb);
    clock.mockRestore();
    // Another client starts a run before this client receives its own creation timestamp.
    const current = { ...old, sessionId: crypto.randomUUID(), remote: { uid: "uid", startedAt: Date.now() } };
    await createStudySession(current);
    stop = subscribeStudySessions("uid", vi.fn());
    await waitForCloud(() => expect(getStudySession(deckId)?.sessionId).toBe(current.sessionId));
    expect((await readSession(old.sessionId)).data()?.endReason).toBeNull();
    expect(getStudySession(deckId)?.currentIndex).toBe(0);
  });

  it("rejects malformed documents without blocking valid sessions or new study", async () => {
    const valid = startRemote();
    await waitForPendingWrites(testDb);
    await expect(
      setDoc(doc(testDb, "studySession", crypto.randomUUID()), { uid: "uid", answers: [] })
    ).rejects.toBeDefined();
    clearStudySessions();
    const onError = vi.fn();
    stop = subscribeStudySessions("uid", onError);
    await waitForCloud(() => expect(getStudySession(deckId)?.sessionId).toBe(valid.sessionId));
    const next = startRemote();
    await waitForPendingWrites(testDb);
    expect((await readSession(next.sessionId)).data()?.endReason).toBeNull();
    expect(onError).not.toHaveBeenCalled();
  });
});
