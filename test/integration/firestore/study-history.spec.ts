import "@/test/initializeTestFirestore";
import { deleteApp, getApps, initializeApp } from "firebase/app";
import {
  disableNetwork,
  doc,
  enableNetwork,
  Timestamp,
  writeBatch,
  connectFirestoreEmulator,
  getFirestore,
  setDoc,
  serverTimestamp,
  onSnapshot,
  collection,
  query,
  where,
} from "firebase/firestore";
import { afterAll, describe, expect, it, vi } from "vitest";
import { subscribeStudyHistory, type StudyHistoryRecord } from "@/entities/study-session";
import { subscribeStudyAnswerHistory, writeStudyAnswer, type StudyAnswerHistory } from "@/entities/study-answer";
import { auth } from "@/shared/firebase";
import { testDb } from "@/test/initializeTestFirestore";

vi.mock("@/shared/firebase", async () => ({
  db: (await import("@/test/initializeTestFirestore")).testDb,
  auth: { currentUser: { uid: "uid", isAnonymous: false } },
}));

afterAll(async () => {
  await Promise.all(getApps().map(deleteApp));
});

describe("Firestore history reads", () => {
  it("[FIRESTORE-STUDY-HISTORY-01] reads period and Deck filters online and from cache", async () => {
    // A unique narrow interval isolates this query from other emulator tests without limiting record count.
    const start = Date.now() + 1_000_000_000;
    const period = { start, end: start + 1 };
    const deckId = crypto.randomUUID();
    const otherDeck = crypto.randomUUID();
    const batch = writeBatch(testDb);
    const document = (
      deck: string,
      startedAt: number,
      endedAt: number | null,
      endReason: "completed" | "abandoned" | null
    ) => ({
      uid: "uid",
      deckId: deck,
      cardOrderIds: ["card"],
      currentIndex: 0,
      startedAt: Timestamp.fromMillis(startedAt),
      endedAt: endedAt === null ? null : Timestamp.fromMillis(endedAt),
      endReason,
      createdAt: Timestamp.fromMillis(startedAt),
      updatedAt: serverTimestamp(),
      lastStudiedAt: endedAt ?? startedAt,
    });
    for (let i = 0; i < 130; i += 1)
      batch.set(doc(testDb, "studySession", crypto.randomUUID()), document(deckId, start, null, null));
    batch.set(doc(testDb, "studySession", crypto.randomUUID()), document(otherDeck, start, start, "completed"));
    batch.set(doc(testDb, "studySession", crypto.randomUUID()), document(deckId, start - 1, start, "completed"));
    batch.set(doc(testDb, "studySession", crypto.randomUUID()), document(deckId, start - 1, start, "abandoned"));
    batch.set(doc(testDb, "studySession", crypto.randomUUID()), document(deckId, start + 1, start + 1, "completed"));
    await batch.commit();

    async function read(deck: string | null, metric: "started" | "completed", cached = false) {
      let records: StudyHistoryRecord[] | undefined;
      let fromCache: boolean | undefined;
      let failure: Error | undefined;
      const stop = subscribeStudyHistory(
        { uid: "uid", period, deckId: deck, metric },
        (value, cache) => {
          if (cached || !cache) {
            records = value;
            fromCache = cache;
          }
        },
        (error) => {
          failure = error;
        }
      );
      try {
        await vi.waitFor(
          () => {
            if (failure) throw failure;
            expect(records).toBeDefined();
          },
          { timeout: 10_000 }
        );
        return { records: records ?? [], fromCache };
      } finally {
        stop();
      }
    }
    expect((await read(null, "started")).records).toHaveLength(131);
    expect((await read(null, "completed")).records.map((record) => record.deckId).sort()).toEqual(
      [deckId, otherDeck].sort()
    );
    expect((await read(deckId, "started")).records).toEqual(
      Array.from({ length: 130 }, () =>
        expect.objectContaining({
          deckId,
          occurredAt: start,
          sessionId: expect.any(String),
          startedAt: start,
          endedAt: null,
          endReason: null,
          cardCount: 1,
        })
      )
    );
    expect((await read(deckId, "completed")).records).toEqual([
      expect.objectContaining({
        deckId,
        occurredAt: start,
        sessionId: expect.any(String),
        startedAt: start - 1,
        endedAt: start,
        endReason: "completed",
        cardCount: 1,
      }),
    ]);
    await disableNetwork(testDb);
    try {
      const cached = await read(deckId, "started", true);
      expect(cached.fromCache).toBe(true);
      expect(cached.records).toHaveLength(130);
      expect((await read(deckId, "completed", true)).records).toHaveLength(1);
    } finally {
      await enableNetwork(testDb);
    }
    const denied = await new Promise<Error>((resolve, reject) => {
      const stop = subscribeStudyHistory(
        { uid: "another-user", period, deckId: null, metric: "started" },
        (_records, cache) => {
          if (!cache) {
            stop();
            reject(new Error("A foreign history query must be denied"));
          }
        },
        (error) => {
          stop();
          resolve(error);
        }
      );
    });
    expect(denied).toMatchObject({ code: "permission-denied" });
  }, 30_000);
});

async function readAnswerHistory(input: Parameters<typeof subscribeStudyAnswerHistory>[0], cached = false) {
  let history: StudyAnswerHistory | undefined;
  let failure: Error | undefined;
  const stop = subscribeStudyAnswerHistory(
    input,
    (value) => {
      if (cached || value.source === "server") history = value;
    },
    (error) => {
      failure = error;
    }
  );
  try {
    await vi.waitFor(() => {
      if (failure) throw failure;
      if (!history) throw new Error("Waiting for history snapshot");
    });
    if (!history) throw new Error("Missing history snapshot");
    return history;
  } finally {
    stop();
  }
}

describe("Bounded answer history", () => {
  it("[FIRESTORE-STUDY-HISTORY-02] reads bounded answers in stable order with source metadata", async () => {
    const from = Date.now() + 2_000_000_000;
    const deckId = crypto.randomUUID();
    const prefix = crypto.randomUUID();
    const batch = writeBatch(testDb);
    for (const [id, rating, time, deck] of [
      ["a", "again", from, deckId],
      ["b", "hard", from, deckId],
      ["c", "good", from, deckId],
      ["d", "easy", from, deckId],
      ["e", "good", from, `${deckId}-other`],
      ["f", "good", from - 1, deckId],
      ["g", "good", from + 1, deckId],
      ["h", "invalid", from, deckId],
    ] as const) {
      const timestamp = Timestamp.fromMillis(time);
      batch.set(doc(testDb, "studyAnswer", `${prefix}-${id}`), {
        uid: "uid",
        deckId: deck,
        sessionId: "session",
        cardId: "card",
        answer: { type: "rating", rating },
        answeredAt: timestamp,
        createdAt: timestamp,
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
    const input = { uid: "uid", from, to: from + 1, deckId, limit: 10 };
    const online = await readAnswerHistory(input);
    expect(online).toMatchObject({ source: "server", truncated: false, invalidCount: 1, hasPendingWrites: false });
    expect(online.records.map((record) => record.id)).toEqual(["d", "c", "b", "a"].map((id) => `${prefix}-${id}`));
    expect((await readAnswerHistory({ ...input, deckId: null })).records).toHaveLength(5);
    const bounded = await readAnswerHistory({ ...input, limit: 2 });
    expect(bounded).toMatchObject({ truncated: true, invalidCount: 1 });
    expect(bounded.records.map((record) => record.id)).toEqual([`${prefix}-d`]);
    await disableNetwork(testDb);
    try {
      expect(await readAnswerHistory(input, true)).toMatchObject({ source: "cache", records: online.records });
      const user = auth.currentUser;
      if (!user) throw new Error("Missing test user");
      Object.assign(user, { isAnonymous: true });
      expect(await readAnswerHistory(input, true)).toMatchObject({ source: "cache", records: online.records });
      expect(await readAnswerHistory({ ...input, from: from + 100, to: from + 101 }, true)).toMatchObject({
        source: "cache",
        records: [],
        truncated: false,
      });
    } finally {
      Object.assign(auth.currentUser ?? {}, { isAnonymous: false });
      await enableNetwork(testDb);
    }
  });

  it("[FIRESTORE-STUDY-HISTORY-03] rejects invalid bounds and foreign owners before subscribing", () => {
    const input = { uid: "uid", from: 100, to: 200, deckId: null, limit: 10 };
    for (const invalid of [
      { uid: "" },
      { uid: "foreign" },
      { deckId: "" },
      { from: 200 },
      { from: 201 },
      { from: NaN },
      { to: Infinity },
      { limit: 0 },
      { limit: 1.5 },
      { limit: 1001 },
    ]) {
      expect(() => subscribeStudyAnswerHistory({ ...input, ...invalid }, vi.fn(), vi.fn())).toThrow();
    }
  });
  it("[FIRESTORE-STUDY-HISTORY-04] streams local writes, acknowledgements and remote changes until stopped", async () => {
    const from = Date.now() + 3_000_000_000;
    const deckId = crypto.randomUUID();
    const input = { uid: "uid", from, to: from + 1, deckId, limit: 10 };
    const remoteApp = initializeApp({ projectId: "test" }, crypto.randomUUID());
    const remote = getFirestore(remoteApp);
    connectFirestoreEmulator(remote, import.meta.env.VITE_DB_HOST, Number.parseInt(import.meta.env.VITE_DB_PORT, 10), {
      mockUserToken: { user_id: "uid", firebase: { sign_in_provider: "google.com", identities: {} } },
    });
    const snapshots: StudyAnswerHistory[] = [];
    const errors: Error[] = [];
    const stop = subscribeStudyAnswerHistory(
      input,
      (value) => snapshots.push(value),
      (error) => errors.push(error)
    );
    let stopObserver: (() => void) | undefined;
    try {
      await vi.waitFor(() => expect(snapshots.at(-1)).toMatchObject({ source: "server", records: [] }));
      await disableNetwork(testDb);
      const batch = writeBatch(testDb);
      writeStudyAnswer(batch, {
        id: crypto.randomUUID(),
        uid: "uid",
        deckId,
        sessionId: "session",
        cardId: "card",
        rating: "good",
        answeredAt: from,
      });
      const committed = batch.commit();
      await vi.waitFor(() =>
        expect(snapshots.at(-1)).toMatchObject({
          source: "cache",
          hasPendingWrites: true,
          records: [expect.objectContaining({ rating: "good" })],
        })
      );
      await enableNetwork(testDb);
      await committed;
      await vi.waitFor(() =>
        expect(snapshots.at(-1)).toMatchObject({
          source: "server",
          hasPendingWrites: false,
          records: [expect.objectContaining({ rating: "good" })],
        })
      );
      const remoteId = crypto.randomUUID();
      const timestamp = Timestamp.fromMillis(from);
      await setDoc(doc(remote, "studyAnswer", remoteId), {
        uid: "uid",
        deckId,
        sessionId: "session",
        cardId: "card",
        answer: { type: "rating", rating: "easy" },
        answeredAt: timestamp,
        createdAt: timestamp,
        updatedAt: serverTimestamp(),
      });
      await vi.waitFor(() => {
        expect(snapshots.at(-1)?.source).toBe("server");
        expect(snapshots.at(-1)?.records).toHaveLength(2);
        expect(snapshots.at(-1)?.records).toContainEqual(expect.objectContaining({ id: remoteId, rating: "easy" }));
      });
      stop();
      const count = snapshots.length;
      const laterId = crypto.randomUUID();
      let observed = false;
      stopObserver = onSnapshot(
        query(collection(testDb, "studyAnswer"), where("uid", "==", "uid"), where("deckId", "==", deckId)),
        { includeMetadataChanges: true },
        (snapshot) => {
          observed = !snapshot.metadata.fromCache && snapshot.docs.some((answer) => answer.id === laterId);
        },
        (error) => errors.push(error)
      );
      await setDoc(doc(remote, "studyAnswer", laterId), {
        uid: "uid",
        deckId,
        sessionId: "session",
        cardId: "card",
        answer: { type: "rating", rating: "again" },
        answeredAt: timestamp,
        createdAt: timestamp,
        updatedAt: serverTimestamp(),
      });
      await vi.waitFor(() => expect(observed).toBe(true));
      expect(snapshots).toHaveLength(count);
      expect(snapshots.at(-1)?.records).toHaveLength(2);
      expect(snapshots.at(-1)?.records).toContainEqual(expect.objectContaining({ id: remoteId, rating: "easy" }));
      expect(errors).toEqual([]);
    } finally {
      stop();
      stopObserver?.();
      await enableNetwork(testDb);
      await deleteApp(remoteApp);
    }
  }, 20_000);
});
