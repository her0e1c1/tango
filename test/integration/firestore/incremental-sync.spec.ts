import fs from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { deleteApp, initializeApp } from "firebase/app";
import {
  collection,
  connectFirestoreEmulator,
  disableNetwork,
  doc,
  enableNetwork,
  getDoc,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  waitForPendingWrites,
  where,
  writeBatch,
  type DocumentData,
  type Firestore,
} from "firebase/firestore";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { replaceAuthSession } from "@/entities/auth";
import { getCards, subscribeCards } from "@/entities/card";
import { editDeck, getDecks, subscribeDecks } from "@/entities/deck";
import {
  getStudySession,
  startStudy,
  subscribeStudyHistory,
  subscribeStudySessions,
  writeStudySessionPosition,
  type StudyHistoryRecord,
} from "@/entities/study-session";
import { subscribeStudyAnswerHistory, type StudyAnswerHistory } from "@/entities/study-answer";
import { createCard, createDeck } from "@/test/factories";

const connection = vi.hoisted(() => ({ db: undefined as unknown as Firestore, user: { uid: "", isAnonymous: false } }));
vi.mock("@/shared/firebase", () => ({
  get db() {
    return connection.db;
  },
  auth: {
    get currentUser() {
      return connection.user;
    },
  },
}));

const token = { firebase: { sign_in_provider: "google.com", identities: {} } } as const;

describe("Incremental Firestore synchronization", () => {
  let environment: RulesTestEnvironment;
  let remote: Firestore;
  let remoteApp: ReturnType<typeof initializeApp>;
  let stops: (() => void)[];
  let uid: string;
  const errors: Error[] = [];
  const onError = (error: Error) => errors.push(error);
  const deckData = (id: string) => ({
    ...createDeck({ id, uid, name: id }),
    deletedAt: null,
    updatedAt: serverTimestamp(),
  });
  const cardData = (id: string, deckId = "deck") => ({
    ...createCard({ id, uid, deckId, frontText: id }),
    updatedAt: serverTimestamp(),
  });
  const answerData = (answeredAt: number, deckId = "deck") => ({
    uid,
    deckId,
    sessionId: "session",
    cardId: "card",
    answer: { type: "rating", rating: "good" },
    answeredAt: Timestamp.fromMillis(answeredAt),
    createdAt: Timestamp.fromMillis(answeredAt),
    updatedAt: serverTimestamp(),
  });
  const seed = (name: string, id: string, data: DocumentData) =>
    environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), name, id), data);
    });
  async function startContent() {
    await Promise.all([
      new Promise<void>((resolve, reject) => stops.push(subscribeDecks(uid, reject, resolve))),
      new Promise<void>((resolve, reject) => stops.push(subscribeCards(uid, reject, resolve))),
    ]);
  }
  function stopContent() {
    for (const stop of stops) stop();
    stops = [];
  }
  // An independent listener establishes that the receiving SDK has observed the server result.
  async function serverBarrier(name: string) {
    await new Promise<void>((resolve, reject) => {
      const stop = onSnapshot(
        query(collection(connection.db, name), where("uid", "==", uid)),
        { includeMetadataChanges: true },
        (snapshot) => {
          if (!snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites) {
            stop();
            resolve();
          }
        },
        reject
      );
      stops.push(stop);
    });
  }
  function history(limit = 1000, deckId: string | null = "deck", from = 0, to = 10_000) {
    let current: StudyAnswerHistory | undefined;
    const stop = subscribeStudyAnswerHistory(
      { uid, from, to, deckId, limit },
      (value) => {
        current = value;
      },
      onError
    );
    stops.push(stop);
    return { get: () => current, stop };
  }
  async function serverHistory(view: ReturnType<typeof history>, length: number) {
    await vi.waitFor(
      () => {
        if (errors.length) throw errors[0];
        const value = view.get();
        if (value?.source !== "server" || value.hasPendingWrites || value.records.length !== length)
          throw new Error("History has not synchronized");
      },
      { timeout: 10_000 }
    );
  }
  beforeAll(async () => {
    environment = await initializeTestEnvironment({
      projectId: "test-incremental-sync",
      firestore: {
        rules: fs.readFileSync("firestore.rules", "utf8"),
        host: import.meta.env.VITE_DB_HOST,
        port: Number(import.meta.env.VITE_DB_PORT),
      },
    });
  });
  beforeEach(async () => {
    await environment.clearFirestore();
    uid = crypto.randomUUID();
    connection.user = { uid, isAnonymous: false };
    connection.db = environment.authenticatedContext(uid, token).firestore() as unknown as Firestore;
    remoteApp = initializeApp({ projectId: "test-incremental-sync" }, crypto.randomUUID());
    remote = getFirestore(remoteApp);
    connectFirestoreEmulator(remote, import.meta.env.VITE_DB_HOST, Number(import.meta.env.VITE_DB_PORT), {
      mockUserToken: { sub: uid, ...token },
    });
    replaceAuthSession({ status: "authenticated", uid, isAnonymous: false, displayName: null });
    stops = [];
    errors.length = 0;
  });
  afterEach(async () => {
    stopContent();
    vi.restoreAllMocks();
    await enableNetwork(connection.db);
    await waitForPendingWrites(connection.db);
    await deleteApp(remoteApp);
  });
  afterAll(async () => environment.cleanup());

  it("[FIRESTORE-INCREMENTAL-SYNC-01] retains unchanged documents and every document at the inclusive boundary", async () => {
    await startContent();
    await serverBarrier("deck");
    expect(getDecks()).toEqual([]);
    expect(getCards()).toEqual([]);
    const batch = writeBatch(remote);
    for (const id of ["deck", "unchanged"]) batch.set(doc(remote, "deck", id), deckData(id));
    for (const id of ["a", "b"]) batch.set(doc(remote, "card", id), cardData(id));
    await batch.commit();
    const boundary = (await getDoc(doc(remote, "card", "a"))).data()?.updatedAt as Timestamp;
    expect(boundary).toEqual((await getDoc(doc(remote, "card", "b"))).data()?.updatedAt);
    await vi.waitFor(() => {
      expect(getCards()).toHaveLength(2);
      expect(getDecks()).toHaveLength(2);
    });
    await serverBarrier("card");
    stopContent();
    await updateDoc(doc(remote, "card", "a"), { frontText: "changed", updatedAt: serverTimestamp() });
    await startContent();
    await vi.waitFor(() => expect(getCards().find(({ id }) => id === "a")?.frontText).toBe("changed"));
    expect(getCards().find(({ id }) => id === "b")?.frontText).toBe("b");
    expect(getDecks()).toHaveLength(2);
    stopContent();
    await startContent();
    await serverBarrier("card");
    expect(getCards().map(({ id }) => id)).toEqual(["a", "b"]);
  });

  it.each(["card", "deck"])("[FIRESTORE-INCREMENTAL-SYNC-02] catches up a stopped %s tombstone", async (kind) => {
    await setDoc(doc(remote, "deck", "deck"), deckData("deck"));
    await setDoc(doc(remote, "deck", "other"), deckData("other"));
    await setDoc(doc(remote, "card", "a"), cardData("a"));
    await setDoc(doc(remote, "card", "other"), cardData("other", "other"));
    await startContent();
    await vi.waitFor(() => expect(getCards()).toHaveLength(2));
    await serverBarrier("card");
    stopContent();
    await updateDoc(doc(remote, kind, kind === "deck" ? "deck" : "a"), {
      deletedAt: 1000,
      updatedAt: serverTimestamp(),
    });
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await startContent();
      await vi.waitFor(() => expect(getCards().map(({ id }) => id)).toEqual(["other"]));
      stopContent();
    }
    expect((await getDoc(doc(remote, kind, kind === "deck" ? "deck" : "a"))).data()?.deletedAt).toBe(1000);
  });

  it.each([-31_536_000_000, 31_536_000_000])(
    "[FIRESTORE-INCREMENTAL-SYNC-03] rolls back pending edits with clock offset %s",
    async (offset) => {
      await setDoc(doc(remote, "deck", "deck"), deckData("deck"));
      await startContent();
      await vi.waitFor(() => expect(getDecks().find(({ id }) => id === "deck")?.name).toBe("deck"));
      await serverBarrier("deck");
      await disableNetwork(connection.db);
      const now = Date.now();
      const clock = vi.spyOn(Date, "now").mockReturnValue(now + offset);
      await editDeck(uid, { id: "deck", name: "pending" });
      clock.mockRestore();
      await vi.waitFor(() => expect(getDecks().find(({ id }) => id === "deck")?.name).toBe("pending"));
      await seed("deck", "deck", { ...deckData("deck"), uid: "different-owner" });
      await enableNetwork(connection.db);
      await waitForPendingWrites(connection.db);
      await serverBarrier("deck");
      await vi.waitFor(() => expect(getDecks().some(({ name }) => name === "pending")).toBe(false));
    }
  );

  it("[FIRESTORE-INCREMENTAL-SYNC-04] applies held changes when an invalid delta is repaired", async () => {
    await setDoc(doc(remote, "deck", "deck"), deckData("deck"));
    stops.push(subscribeDecks(uid, onError));
    await vi.waitFor(() => expect(getDecks().find(({ id }) => id === "deck")?.name).toBe("deck"));
    await serverBarrier("deck");
    const batch = writeBatch(remote);
    batch.update(doc(remote, "deck", "deck"), { name: "changed", updatedAt: serverTimestamp() });
    batch.set(doc(remote, "deck", "invalid"), { ...deckData("invalid"), name: 42 });
    await batch.commit();
    await vi.waitFor(() => expect(errors.length).toBeGreaterThan(0));
    expect(getDecks().find(({ id }) => id === "deck")?.name).toBe("deck");
    await updateDoc(doc(remote, "deck", "invalid"), { name: "repaired", updatedAt: serverTimestamp() });
    await vi.waitFor(() => expect(getDecks().map(({ name }) => name)).toEqual(["changed", "repaired"]));
  });

  it("[FIRESTORE-INCREMENTAL-SYNC-05] shares ended sessions with history while preserving event times", async () => {
    let started: StudyHistoryRecord[] = [];
    let completed: StudyHistoryRecord[] = [];
    stops.push(subscribeStudySessions(uid, onError));
    const input = { uid, period: { start: 0, end: 3000 }, deckId: "deck" };
    const stopStarted = subscribeStudyHistory(
      { ...input, metric: "started" },
      (records) => {
        started = records;
      },
      onError
    );
    stops.push(
      stopStarted,
      subscribeStudyHistory(
        { ...input, metric: "completed" },
        (records) => {
          completed = records;
        },
        onError
      )
    );
    await startStudy({ uid, deckId: "deck", cardOrderIds: ["a", "b"], now: 1000 });
    await vi.waitFor(() => {
      expect(started).toHaveLength(1);
      expect(getStudySession("deck")?.lastStudiedAt).toBe(1000);
    });
    stopStarted();
    const session = getStudySession("deck");
    if (!session) throw new Error("Missing session");
    const batch = writeBatch(connection.db);
    writeStudySessionPosition(batch, { ...session, lastStudiedAt: 2000 }, 2);
    await batch.commit();
    await vi.waitFor(() => {
      expect(completed).toHaveLength(1);
      expect(getStudySession("deck")).toBeUndefined();
    });
    expect(completed[0]).toMatchObject({ sessionId: session.sessionId, occurredAt: 2000, endedAt: 2000 });
    expect((await getDoc(doc(remote, "studySession", session.sessionId))).data()).toMatchObject({
      lastStudiedAt: 2000,
      updatedAt: expect.any(Timestamp),
    });
    expect(errors).toEqual([]);
  });

  it.each([2, 1000])(
    "[FIRESTORE-INCREMENTAL-SYNC-06] catches up more than %s answers and keeps history scopes independent",
    async (maximum) => {
      await setDoc(doc(remote, "studyAnswer", "initial"), answerData(3000));
      const initial = history(maximum);
      const allDecks = history(maximum, null);
      const past = history(maximum, "deck", 0, 2000);
      await serverHistory(initial, 1);
      await serverHistory(allDecks, 1);
      await serverHistory(past, 0);
      stopContent();
      for (let offset = 0; offset < maximum + 3; offset += 400) {
        const batch = writeBatch(remote);
        for (let index = offset; index < Math.min(offset + 400, maximum + 3); index += 1)
          batch.set(doc(remote, "studyAnswer", `answer-${String(index).padStart(4, "0")}`), answerData(4000));
        await batch.commit();
      }
      await setDoc(doc(remote, "studyAnswer", "backdated"), answerData(1000));
      await setDoc(doc(remote, "studyAnswer", "foreign-deck"), answerData(5000, "other"));
      const resumed = history(maximum);
      const resumedAll = history(maximum, null);
      const resumedPast = history(maximum, "deck", 0, 2000);
      await serverHistory(resumed, maximum);
      await serverHistory(resumedAll, maximum);
      await serverHistory(resumedPast, 1);
      await vi.waitFor(() =>
        expect(resumed.get()?.records[0]?.id).toBe(`answer-${String(maximum + 2).padStart(4, "0")}`)
      );
      expect(resumed.get()?.truncated).toBe(true);
      expect(resumed.get()?.records.at(-1)?.id).toBe("answer-0003");
      expect(resumedAll.get()?.records[0]?.id).toBe("foreign-deck");
      expect(resumedPast.get()?.records.map(({ id }) => id)).toEqual(["backdated"]);
      expect(resumedPast.get()?.truncated).toBe(false);
    },
    30_000
  );

  it.each([false, true])(
    "[FIRESTORE-INCREMENTAL-SYNC-07] merges answers arriving during bootstrap (existing=%s)",
    async (existing) => {
      if (existing) await setDoc(doc(remote, "studyAnswer", "initial"), answerData(3000));
      let current: StudyAnswerHistory | undefined;
      let added: Promise<void> | undefined;
      stops.push(
        subscribeStudyAnswerHistory(
          { uid, from: 0, to: 10_000, deckId: "deck", limit: 1000 },
          (value) => {
            current = value;
            added ??= setDoc(doc(remote, "studyAnswer", "during-bootstrap"), answerData(2000));
          },
          onError
        )
      );
      await vi.waitFor(
        () => {
          expect(errors).toEqual([]);
          expect(current).toMatchObject({ source: "server", hasPendingWrites: false });
          expect(current?.records.map(({ id }) => id)).toEqual(
            existing ? ["initial", "during-bootstrap"] : ["during-bootstrap"]
          );
        },
        { timeout: 10_000 }
      );
      await added;
    }
  );

  it.each(["deck", "card", "studySession", "studyAnswer"] as const)(
    "[FIRESTORE-INCREMENTAL-SYNC-08] requires server update times for %s writes",
    async (kind) => {
      await setDoc(doc(remote, "deck", "deck"), deckData("deck"));
      const data: DocumentData = {
        deck: deckData("new"),
        card: cardData("new"),
        studyAnswer: answerData(1000),
        studySession: {
          uid,
          deckId: "deck",
          cardOrderIds: ["a", "b"],
          currentIndex: 0,
          startedAt: Timestamp.fromMillis(1000),
          lastStudiedAt: 1000,
          createdAt: Timestamp.fromMillis(1000),
          endedAt: null,
          endReason: null,
          updatedAt: serverTimestamp(),
        },
      }[kind];
      const reference = doc(remote, kind, "new");
      for (const updatedAt of [1000, Timestamp.fromMillis(1000), undefined]) {
        const invalid = Object.fromEntries(
          Object.entries({ ...data, updatedAt }).filter(([, value]) => value !== undefined)
        );
        await assertFails(setDoc(reference, invalid));
      }
      await assertSucceeds(setDoc(reference, data));
      if (kind !== "studyAnswer") {
        const fields = { deck: { name: "edited" }, card: { fsrs: {} }, studySession: { currentIndex: 1 } }[kind];
        for (const updatedAt of [1000, Timestamp.fromMillis(1000), undefined])
          await assertFails(updateDoc(reference, { ...fields, ...(updatedAt === undefined ? {} : { updatedAt }) }));
        await assertSucceeds(updateDoc(reference, { ...fields, updatedAt: serverTimestamp() }));
      }
    }
  );
});
