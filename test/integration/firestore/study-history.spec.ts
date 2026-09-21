import "@/test/initializeTestFirestore";
import { deleteApp, getApps } from "firebase/app";
import { disableNetwork, doc, enableNetwork, Timestamp, writeBatch } from "firebase/firestore";
import { afterAll, describe, expect, it, vi } from "vitest";
import { subscribeStudyHistory, type StudyHistoryRecord } from "@/entities/study-session";
import { testDb } from "@/test/initializeTestFirestore";

vi.mock("@/shared/firebase", async () => ({ db: (await import("@/test/initializeTestFirestore")).testDb }));

describe("STUDY-SESSION-09 STUDY-SESSION-12 Firestore history reads", () => {
  afterAll(async () => {
    await Promise.all(getApps().map(deleteApp));
  });

  it("reads the entire period with both optional Deck constraints and delivers offline cache snapshots", async () => {
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
      Array.from({ length: 130 }, () => ({ deckId, occurredAt: start }))
    );
    expect((await read(deckId, "completed")).records).toEqual([{ deckId, occurredAt: start }]);
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
