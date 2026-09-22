import "@/test/initializeTestFirestore";
import { deleteApp, getApps } from "firebase/app";
import { disableNetwork, doc, enableNetwork, Timestamp, writeBatch } from "firebase/firestore";
import { afterAll, describe, expect, it, vi } from "vitest";
import { subscribeStudyHistory, type StudyHistoryRecord } from "@/entities/study-session";
import { readStudyAnswerHistory } from "@/entities/study-answer";
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
      updatedAt: Timestamp.fromMillis(endedAt ?? startedAt),
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
        updatedAt: timestamp,
      });
    }
    await batch.commit();
    const input = { uid: "uid", from, to: from + 1, deckId, limit: 10 };
    const online = await readStudyAnswerHistory(input);
    expect(online).toMatchObject({ source: "server", truncated: false, invalidCount: 1, hasPendingWrites: false });
    expect(online.records.map((record) => record.id)).toEqual(["d", "c", "b", "a"].map((id) => `${prefix}-${id}`));
    expect((await readStudyAnswerHistory({ ...input, deckId: null })).records).toHaveLength(5);
    const bounded = await readStudyAnswerHistory({ ...input, limit: 2 });
    expect(bounded).toMatchObject({ truncated: true, invalidCount: 1 });
    expect(bounded.records.map((record) => record.id)).toEqual([`${prefix}-d`]);
    await disableNetwork(testDb);
    try {
      expect(await readStudyAnswerHistory(input)).toMatchObject({ source: "cache", records: online.records });
      const user = auth.currentUser;
      if (!user) throw new Error("Missing test user");
      Object.assign(user, { isAnonymous: true });
      expect(await readStudyAnswerHistory(input)).toMatchObject({ source: "cache", records: online.records });
      expect(await readStudyAnswerHistory({ ...input, from: from + 100, to: from + 101 })).toMatchObject({
        source: "cache",
        records: [],
        truncated: false,
      });
    } finally {
      Object.assign(auth.currentUser ?? {}, { isAnonymous: false });
      await enableNetwork(testDb);
    }
  });

  it("[FIRESTORE-STUDY-HISTORY-03] rejects invalid bounds and foreign owners before reading", async () => {
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
      await expect(readStudyAnswerHistory({ ...input, ...invalid })).rejects.toThrow();
    }
  });
});
