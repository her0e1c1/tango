import fs from "node:fs";
import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { IDBObjectStore } from "fake-indexeddb";
import {
  collection,
  disableNetwork,
  doc,
  enableNetwork,
  getDocs,
  getDocFromCache,
  onSnapshot,
  query,
  QuerySnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  waitForPendingWrites,
  where,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearRemoteCards,
  getCards,
  subscribeCards,
  calculateFsrsState,
  createCard as saveCard,
  editCard,
  deleteCard,
} from "@/entities/card";
import { restoreCardReplica, saveConfirmedCards } from "@/entities/card/api/replica";
import * as documents from "@/entities/card/api/document";
import * as store from "@/entities/card/model/store";
import { replaceRemoteDecks } from "@/test/utils/entityFixtures";
import { createCard, createDeck } from "@/test/factories";

const connection = vi.hoisted(() => ({ db: undefined as unknown as Firestore, isAnonymous: false }));
vi.mock("@/shared/firebase", () => ({
  get db() {
    return connection.db;
  },
  auth: {
    get currentUser() {
      return { isAnonymous: connection.isAnonymous };
    },
  },
}));

async function replicaDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("tango-card-replica", 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function readReplica() {
  const database = await replicaDatabase();
  try {
    const transaction = database.transaction(["cards", "metadata"]);
    const metadata = transaction.objectStore("metadata").get("replica");
    const cards = transaction.objectStore("cards").getAll();
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => reject(transaction.error);
    });
    return { metadata: metadata.result, cards: cards.result as ReturnType<typeof createCard>[] };
  } finally {
    database.close();
  }
}

describe("Card replica and Store deltas", () => {
  let environment: RulesTestEnvironment;
  let uid: string;
  let stops: (() => void)[];
  let errors: Error[];
  const start = () => stops.push(subscribeCards(uid, (error) => errors.push(error)));
  const stop = () => {
    for (const unsubscribe of stops) unsubscribe();
    stops = [];
  };
  const card = (id: string, updatedAt = 1000) => ({
    ...createCard({ id, uid, deckId: "deck", frontText: id }),
    updatedAt: Timestamp.fromMillis(updatedAt),
  });
  const cardWithDamagedFsrs = (id: string, damage: "missing" | "invalid") => {
    const value = { ...card(id), fsrs: {} as never };
    if (damage === "missing") Reflect.deleteProperty(value, "fsrs");
    return value;
  };
  async function subscribeCachedAnonymousCards() {
    connection.isAnonymous = true;
    await getDocs(query(collection(connection.db, "card"), where("uid", "==", uid)));
    await disableNetwork(connection.db);
    await new Promise<void>((resolve, reject) =>
      stops.push(
        subscribeCards(
          uid,
          (error) => {
            errors.push(error);
            reject(error);
          },
          resolve
        )
      )
    );
  }
  const seed = async (values: ReturnType<typeof card>[]) =>
    environment.withSecurityRulesDisabled(async (context) => {
      for (let offset = 0; offset < values.length; offset += 400) {
        const batch = writeBatch(context.firestore() as unknown as Firestore);
        for (const value of values.slice(offset, offset + 400))
          batch.set(doc(context.firestore(), "card", value.id), value);
        await batch.commit();
      }
    });
  async function loaded(ids: string[]) {
    await vi.waitFor(() => expect(getCards().map(({ id }) => id)).toEqual(ids), { timeout: 10000 });
  }
  async function checkpoint(value: number) {
    await vi.waitFor(async () => expect((await readReplica()).metadata.lastUpdatedAt).toBe(value));
  }
  async function localPending() {
    await new Promise<void>((resolve, reject) => {
      const unsubscribe = onSnapshot(
        query(collection(connection.db, "card"), where("uid", "==", uid)),
        { includeMetadataChanges: true },
        (snapshot) => {
          if (snapshot.metadata.hasPendingWrites) {
            unsubscribe();
            resolve();
          }
        },
        reject
      );
      stops.push(unsubscribe);
    });
  }
  beforeAll(async () => {
    environment = await initializeTestEnvironment({
      projectId: "test-card-replica",
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
    connection.isAnonymous = false;
    connection.db = environment
      .authenticatedContext(uid, {
        firebase: { sign_in_provider: "google.com", identities: {} },
      })
      .firestore() as unknown as Firestore;
    stops = [];
    errors = [];
    clearRemoteCards();
    replaceRemoteDecks([createDeck({ id: "deck", uid })]);
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "deck", "deck"), { ...createDeck({ id: "deck", uid }), deletedAt: null });
    });
  });
  afterEach(async () => {
    stop();
    vi.restoreAllMocks();
    await enableNetwork(connection.db);
    await waitForPendingWrites(connection.db);
  });
  afterAll(async () => environment.cleanup());

  it("[FIRESTORE-CARD-REPLICA-01] regular: resumes inclusively with stopped edits, creates and tombstones", async () => {
    await seed([card("a"), card("b"), card("unchanged"), card("boundary", 2000)]);
    start();
    await loaded(["a", "b", "boundary", "unchanged"]);
    await checkpoint(2000);
    stop();
    await seed([
      card("same-ms", 2000),
      { ...card("a", 3000), frontText: "edited" },
      { ...card("b", 3000), deletedAt: 3000 },
      card("c", 3000),
    ]);
    clearRemoteCards();
    start();
    await loaded(["a", "boundary", "c", "same-ms", "unchanged"]);
    await vi.waitFor(() => expect(getCards().find(({ id }) => id === "a")?.frontText).toBe("edited"));
    await checkpoint(3000);
    expect(errors).toEqual([]);
  });

  it.each(["missing", "lost-card", "corrupt", "version", "uid", "checkpoint"])(
    "[FIRESTORE-CARD-REPLICA-02] regular: full-syncs an unusable replica: %s",
    async (damage) => {
      await seed([card("old"), card("new", 2000)]);
      start();
      await loaded(["new", "old"]);
      await checkpoint(2000);
      stop();
      if (damage === "missing") {
        await new Promise<void>((resolve) => {
          indexedDB.deleteDatabase("tango-card-replica").onsuccess = () => resolve();
        });
      } else {
        const database = await replicaDatabase();
        const transaction = database.transaction(["cards", "metadata"], "readwrite");
        if (damage === "lost-card") transaction.objectStore("cards").delete("old");
        if (damage === "corrupt") transaction.objectStore("cards").put({ id: "old", frontText: 42 });
        if (damage === "version" || damage === "uid" || damage === "checkpoint")
          transaction.objectStore("metadata").put(
            {
              uid: damage === "uid" ? "foreign" : uid,
              version: damage === "version" ? 99 : 1,
              count: 2,
              lastUpdatedAt: damage === "checkpoint" ? 9000 : 2000,
            },
            "replica"
          );
        await new Promise<void>((resolve) => {
          transaction.oncomplete = () => resolve();
        });
        database.close();
      }
      clearRemoteCards();
      start();
      await loaded(["new", "old"]);
      await checkpoint(2000);
      expect(errors).toEqual([]);
    }
  );

  it.each(["edit", "create", "tombstone"])(
    "[FIRESTORE-CARD-REPLICA-03] regular: ignores a pending and rejected %s",
    async (kind) => {
      await seed([card("old"), card("boundary", 2000)]);
      start();
      await loaded(["boundary", "old"]);
      await checkpoint(2000);
      stop();
      start();
      await loaded(["boundary", "old"]);
      await disableNetwork(connection.db);
      // Changing the immutable creation time makes Rules reject without changing the owner/query match.
      const pending =
        kind === "create"
          ? setDoc(doc(connection.db, "card", "ghost"), {
              ...card("ghost"),
              deckId: "missing",
              updatedAt: serverTimestamp(),
            })
          : updateDoc(doc(connection.db, "card", "old"), {
              createdAt: -1,
              updatedAt: serverTimestamp(),
              ...(kind === "edit" ? { frontText: "pending" } : { deletedAt: 3000 }),
            });
      const rejected = pending.catch((error: unknown) => error);
      await localPending();
      expect(getCards().map(({ frontText }) => frontText)).toEqual(["boundary", "old"]);
      expect((await readReplica()).cards.map(({ frontText }) => frontText).sort()).toEqual(["boundary", "old"]);
      await enableNetwork(connection.db);
      await expect(rejected).resolves.toMatchObject({ code: "permission-denied" });
      await waitForPendingWrites(connection.db);
      await loaded(["boundary", "old"]);
      stop();
      expect((await restoreCardReplica(uid))?.cards.map(({ frontText }) => frontText).sort()).toEqual([
        "boundary",
        "old",
      ]);
    }
  );

  it("[FIRESTORE-CARD-REPLICA-04] regular: restores confirmed state after pending, stop, reject, restart", async () => {
    await seed([card("old"), card("boundary", 2000)]);
    start();
    await loaded(["boundary", "old"]);
    await checkpoint(2000);
    await disableNetwork(connection.db);
    const rejected = updateDoc(doc(connection.db, "card", "old"), {
      frontText: "pending",
      createdAt: -1,
      updatedAt: serverTimestamp(),
    }).catch((error: unknown) => error);
    await localPending();
    stop();
    await enableNetwork(connection.db);
    await expect(rejected).resolves.toMatchObject({ code: "permission-denied" });
    clearRemoteCards();
    start();
    await loaded(["boundary", "old"]);
    expect(getCards().find(({ id }) => id === "old")?.frontText).toBe("old");
    expect((await readReplica()).cards.find(({ id }) => id === "old")?.frontText).toBe("old");
  });

  it.each(["repair", "live", "cached"])(
    "[FIRESTORE-CARD-REPLICA-05] regular: retries the complete unapplied window: %s",
    async (source) => {
      await seed([card("old")]);
      start();
      await loaded(["old"]);
      await checkpoint(1000);
      stop();
      await seed([
        { ...card("old", 2000), frontText: "edited" },
        { ...card("invalid", 2000), fsrs: {} as never },
      ]);
      if (source === "cached") {
        await getDocs(query(collection(connection.db, "card"), where("uid", "==", uid)));
        await disableNetwork(connection.db);
      }
      const changes = vi.spyOn(QuerySnapshot.prototype, "docChanges");
      start();
      if (source === "cached") {
        await vi.waitUntil(() =>
          changes.mock.contexts.some((snapshot) => snapshot instanceof QuerySnapshot && snapshot.metadata.fromCache)
        );
        await enableNetwork(connection.db);
      }
      await vi.waitFor(() => expect(errors.length).toBeGreaterThan(0));
      changes.mockRestore();
      expect(getCards().map(({ frontText }) => frontText)).toEqual(["old"]);
      await checkpoint(1000);
      let rejection: unknown;
      if (source === "repair") {
        await seed([card("invalid", 3000)]);
      } else {
        await disableNetwork(connection.db);
        const rejected = updateDoc(doc(connection.db, "card", "old"), {
          frontText: "pending",
          createdAt: -1,
          updatedAt: serverTimestamp(),
        }).catch((error: unknown) => error);
        await localPending();
        // Move the server document below the active query boundary while the local write is pending.
        await seed([card("old", 500), card("invalid", 3000)]);
        await enableNetwork(connection.db);
        rejection = await rejected;
      }
      const denied = expect.objectContaining({ code: "permission-denied" });
      expect(rejection).toEqual(source === "repair" ? undefined : denied);
      await loaded(["invalid", "old"]);
      await vi.waitFor(() => expect(getCards().find(({ id }) => id === "old")?.frontText).toBe("edited"));
      await checkpoint(3000);
    }
  );

  it("[FIRESTORE-CARD-REPLICA-06] regular: cancels a restoring owner before switching UID", async () => {
    await seed([card("a")]);
    start();
    await loaded(["a"]);
    await checkpoint(1000);
    stop();
    const ready = vi.fn();
    const unsubscribe = subscribeCards(uid, vi.fn(), ready);
    unsubscribe();
    uid = "second-owner";
    connection.db = environment
      .authenticatedContext(uid, { firebase: { sign_in_provider: "google.com" } })
      .firestore() as unknown as Firestore;
    replaceRemoteDecks([createDeck({ id: "deck", uid })]);
    await seed([card("b")]);
    start();
    await loaded(["b"]);
    expect(ready).not.toHaveBeenCalled();
    expect((await readReplica()).metadata.uid).toBe(uid);
  });

  it("[FIRESTORE-CARD-REPLICA-07] regular: aborts Card and checkpoint changes together", async () => {
    await seed([card("old")]);
    start();
    await loaded(["old"]);
    await checkpoint(1000);
    stop();
    const put = IDBObjectStore.prototype.put;
    const failure = vi.spyOn(IDBObjectStore.prototype, "put").mockImplementation(function (
      this: IDBObjectStore,
      value,
      key
    ) {
      const request = key === undefined ? put.call(this, value) : put.call(this, value, key);
      if (this.name === "metadata") this.transaction.abort();
      return request;
    });
    await expect(
      saveConfirmedCards(uid, [createCard({ id: "old", uid, frontText: "new", updatedAt: 2000 })], 2000, {
        replace: false,
        signal: new AbortController().signal,
      })
    ).rejects.toBeDefined();
    failure.mockRestore();
    clearRemoteCards();
    const restored = await restoreCardReplica(uid);
    expect(restored?.metadata).toMatchObject({ lastUpdatedAt: 1000 });
    expect(restored?.cards.map(({ frontText }) => frontText)).toEqual(["old"]);
  });

  it.each([
    { account: "regular", isAnonymous: false },
    { account: "anonymous", isAnonymous: true },
  ])(
    "[FIRESTORE-CARD-REPLICA-08] $account: processes only Card A's change among 1000 Cards",
    async ({ isAnonymous }) => {
      connection.isAnonymous = isAnonymous;
      const cardA = card("card-a");
      const cardB = card("card-b");
      const values = [
        cardA,
        cardB,
        ...Array.from({ length: 998 }, (_, index) => card(`card-other-${String(index).padStart(4, "0")}`)),
      ];
      await seed(values);
      start();
      await loaded(values.map(({ id }) => id));
      if (!isAnonymous) await checkpoint(1000);
      const unchanged = getCards().slice(1);
      const parse = vi.spyOn(documents, "parseCardDocument");
      const parseLocal = vi.spyOn(documents, "parseLocalCardDocuments");
      const apply = vi.spyOn(store, "applyCardChanges");
      const put = vi.spyOn(IDBObjectStore.prototype, "put");
      await environment.withSecurityRulesDisabled(async (context) => {
        await updateDoc(doc(context.firestore(), "card", cardA.id), {
          frontText: "changed",
          updatedAt: serverTimestamp(),
        });
      });
      await vi.waitFor(() => expect(getCards().find(({ id }) => id === cardA.id)?.frontText).toBe("changed"));
      expect(
        isAnonymous
          ? parseLocal.mock.calls.flatMap(([values]) => values.map(({ id }) => id))
          : parse.mock.calls.map(([id]) => id)
      ).toEqual([cardA.id]);
      expect(apply.mock.calls.flatMap(([cards]) => cards.map(({ id }) => id))).toEqual([cardA.id]);
      expect(put.mock.calls.filter(([value]) => "id" in value).map(([value]) => value.id)).toEqual(
        isAnonymous ? [] : [cardA.id]
      );
      const updated = getCards();
      expect(updated).toHaveLength(1000);
      for (const [index, card] of unchanged.entries()) expect(updated[index + 1]).toBe(card);
      expect((await indexedDB.databases()).map(({ name }) => name)).toEqual(isAnonymous ? [] : ["tango-card-replica"]);
    },
    20000
  );

  it("[FIRESTORE-CARD-REPLICA-09] regular: keeps the checkpoint unchanged for cached and pending snapshots", async () => {
    await seed([card("old")]);
    start();
    await loaded(["old"]);
    await checkpoint(1000);
    stop();
    await disableNetwork(connection.db);
    clearRemoteCards();
    await new Promise<void>((resolve, reject) => stops.push(subscribeCards(uid, reject, resolve)));
    const write = updateDoc(doc(connection.db, "card", "old"), { frontText: "pending", updatedAt: serverTimestamp() });
    await localPending();
    await checkpoint(1000);
    expect(getCards()[0]?.frontText).toBe("old");
    expect((await readReplica()).cards[0]?.frontText).toBe("old");
    await enableNetwork(connection.db);
    await write;
    await vi.waitFor(() => expect(getCards()[0]?.frontText).toBe("pending"));
  });

  it("[FIRESTORE-CARD-REPLICA-10] regular: applies FSRS only after the server acknowledgement", async () => {
    await seed([card("old")]);
    start();
    await loaded(["old"]);
    await checkpoint(1000);
    await disableNetwork(connection.db);
    const fsrs = calculateFsrsState(null, "good", 1000);
    const write = updateDoc(doc(connection.db, "card", "old"), { fsrs, updatedAt: serverTimestamp() });
    await localPending();
    expect(getCards()[0]?.fsrs).toBeNull();
    expect((await readReplica()).cards[0]?.fsrs).toBeNull();
    await enableNetwork(connection.db);
    await write;
    await vi.waitFor(() => expect(getCards()[0]?.fsrs).toEqual(fsrs));
    expect((await readReplica()).cards[0]?.fsrs).toEqual(fsrs);
  });
  it("[FIRESTORE-CARD-REPLICA-11] anonymous: creates, edits, restores and tombstones Card A offline without a replica", async () => {
    connection.isAnonymous = true;
    const cardA = createCard({ id: "card-a", uid, deckId: "deck", frontText: "created" });
    await disableNetwork(connection.db);
    await new Promise<void>((resolve, reject) => stops.push(subscribeCards(uid, reject, resolve)));
    expect(getCards()).toEqual([]);

    await saveCard(uid, cardA);
    await loaded([cardA.id]);
    expect(getCards()[0]?.frontText).toBe("created");

    await editCard(uid, { id: cardA.id, frontText: "edited" });
    await vi.waitFor(() => expect(getCards()[0]?.frontText).toBe("edited"));

    stop();
    clearRemoteCards();
    await new Promise<void>((resolve, reject) => stops.push(subscribeCards(uid, reject, resolve)));
    expect(getCards()[0]?.frontText).toBe("edited");

    await deleteCard(uid, cardA.id);
    await loaded([]);
    expect(await indexedDB.databases()).toEqual([]);
  });

  it.each(["missing", "invalid"] as const)(
    "[FIRESTORE-CARD-REPLICA-12] anonymous: completes initial readiness with zero valid Cards and %s FSRS",
    async (damage) => {
      const cardA = cardWithDamagedFsrs("card-a", damage);
      await seed([cardA]);
      await subscribeCachedAnonymousCards();

      expect(getCards()).toEqual([]);
      expect(store.cardStore.getState().invalidCardIds).toEqual([cardA.id]);
      expect((await getDocFromCache(doc(connection.db, "card", cardA.id))).data()?.fsrs).toEqual(cardA.fsrs);
      expect(errors).toEqual([]);
      expect(await indexedDB.databases()).toEqual([]);
    }
  );

  it.each(["missing", "invalid"] as const)(
    "[FIRESTORE-CARD-REPLICA-13] anonymous: repairs, re-isolates and repairs Card A with %s FSRS while updating Card B",
    async (damage) => {
      const cardA = card("card-a");
      const damagedCardA = cardWithDamagedFsrs(cardA.id, damage);
      const cardB = card("card-b");
      await seed([damagedCardA]);
      await subscribeCachedAnonymousCards();
      expect(store.cardStore.getState().invalidCardIds).toEqual([cardA.id]);
      await enableNetwork(connection.db);

      // Repair Card A and add Card B in the same notification.
      await seed([cardA, cardB]);
      await loaded([cardA.id, cardB.id]);
      expect(store.cardStore.getState().invalidCardIds).toEqual([]);

      // Re-isolate Card A while publishing Card B's update.
      await seed([damagedCardA, { ...cardB, frontText: "changed" }]);
      await loaded([cardB.id]);
      expect(getCards()[0]?.frontText).toBe("changed");
      expect(store.cardStore.getState().invalidCardIds).toEqual([cardA.id]);
      expect((await getDocFromCache(doc(connection.db, "card", cardA.id))).data()?.fsrs).toEqual(damagedCardA.fsrs);

      // A second repair must restore Card A without reverting Card B.
      await seed([cardA]);
      await loaded([cardA.id, cardB.id]);
      expect(store.cardStore.getState().invalidCardIds).toEqual([]);
      expect(getCards().find(({ id }) => id === cardB.id)?.frontText).toBe("changed");
      expect(errors).toEqual([]);
      expect(await indexedDB.databases()).toEqual([]);
    }
  );

  it.each(["missing", "invalid"] as const)(
    "[FIRESTORE-CARD-REPLICA-14] anonymous: applies Card B's tombstone and clears Card A's %s FSRS diagnostic after a valid tombstone",
    async (damage) => {
      const cardA = card("card-a");
      const damagedCardA = cardWithDamagedFsrs(cardA.id, damage);
      const cardB = card("card-b");
      await seed([damagedCardA, cardB]);
      await subscribeCachedAnonymousCards();
      expect(getCards().map(({ id }) => id)).toEqual([cardB.id]);
      expect(store.cardStore.getState().invalidCardIds).toEqual([cardA.id]);
      await enableNetwork(connection.db);

      // Card B's logical deletion must retain Card A's diagnostic.
      await seed([{ ...cardB, deletedAt: 2000 }]);
      await loaded([]);
      expect(store.cardStore.getState().invalidCardIds).toEqual([cardA.id]);
      expect((await getDocFromCache(doc(connection.db, "card", cardB.id))).data()?.deletedAt).toBe(2000);

      await seed([cardA]);
      await loaded([cardA.id]);
      expect(store.cardStore.getState().invalidCardIds).toEqual([]);

      await seed([damagedCardA]);
      await vi.waitFor(() => expect(store.cardStore.getState().invalidCardIds).toEqual([cardA.id]));
      expect(getCards()).toEqual([]);

      // A valid tombstone clears the re-isolated Card A's diagnostic.
      await seed([{ ...cardA, deletedAt: 3000 }]);
      await vi.waitFor(() => expect(store.cardStore.getState().invalidCardIds).toEqual([]));
      expect(getCards()).toEqual([]);
      expect((await getDocFromCache(doc(connection.db, "card", cardA.id))).data()?.deletedAt).toBe(3000);
      expect(errors).toEqual([]);
      expect(await indexedDB.databases()).toEqual([]);
    }
  );

  it.each(["missing", "invalid"] as const)(
    "[FIRESTORE-CARD-REPLICA-15] anonymous: removes Card A's %s FSRS diagnostic and Card B after physical deletion",
    async (damage) => {
      const cardA = cardWithDamagedFsrs("card-a", damage);
      const cardB = card("card-b");
      await seed([cardA, cardB]);
      await subscribeCachedAnonymousCards();
      expect(getCards().map(({ id }) => id)).toEqual([cardB.id]);
      expect(store.cardStore.getState().invalidCardIds).toEqual([cardA.id]);
      await enableNetwork(connection.db);

      await environment.withSecurityRulesDisabled(async (context) => {
        const batch = writeBatch(context.firestore() as unknown as Firestore);
        batch.delete(doc(context.firestore(), "card", cardA.id));
        batch.delete(doc(context.firestore(), "card", cardB.id));
        await batch.commit();
      });
      await vi.waitFor(() => {
        expect(getCards()).toEqual([]);
        expect(store.cardStore.getState().invalidCardIds).toEqual([]);
      });
      expect(errors).toEqual([]);
      expect(await indexedDB.databases()).toEqual([]);
    }
  );

  it("[FIRESTORE-CARD-REPLICA-16] anonymous: switches from UID A to UID B without old Cards, diagnostics or notifications", async () => {
    connection.isAnonymous = true;
    const uidA = uid;
    const uidB = crypto.randomUUID();
    await seed([card("card-a"), { ...card("card-b"), fsrs: {} as never }, { ...card("card-c"), uid: uidB }]);
    await getDocs(query(collection(connection.db, "card"), where("uid", "==", uid)));
    const receivingDbA = connection.db;
    const ready = vi.fn();
    stops.push(subscribeCards(uid, (error) => errors.push(error), ready));
    await loaded(["card-a"]);
    await vi.waitFor(() => expect(store.cardStore.getState().invalidCardIds).toEqual(["card-b"]));
    stop();
    const readyCount = ready.mock.calls.length;
    uid = uidB;
    connection.db = environment
      .authenticatedContext(uid, { firebase: { sign_in_provider: "google.com", identities: {} } })
      .firestore() as unknown as Firestore;
    replaceRemoteDecks([createDeck({ id: "deck", uid })]);
    start();
    await loaded(["card-c"]);
    expect(store.cardStore.getState().invalidCardIds).toEqual([]);
    const state = store.cardStore.getState();
    // Observe arrival on the old receiving client before checking that its stopped subscriber stayed silent.
    const received = new Promise<void>((resolve, reject) =>
      stops.push(
        onSnapshot(
          doc(receivingDbA, "card", "card-a"),
          (snapshot) => {
            if (!snapshot.metadata.fromCache && snapshot.data()?.frontText === "late") resolve();
          },
          reject
        )
      )
    );
    await seed([{ ...card("card-a"), uid: uidA, frontText: "late" }]);
    await received;
    expect(store.cardStore.getState()).toBe(state);
    expect(ready).toHaveBeenCalledTimes(readyCount);
    expect(errors).toEqual([]);
  });

  it("[FIRESTORE-CARD-REPLICA-17] anonymous: calls ready without reprocessing Card A on metadata-only notifications", async () => {
    connection.isAnonymous = true;
    await seed([card("card-a")]);
    await getDocs(query(collection(connection.db, "card"), where("uid", "==", uid)));
    await disableNetwork(connection.db);
    const ready = vi.fn();
    stops.push(subscribeCards(uid, (error) => errors.push(error), ready));
    await vi.waitFor(() => expect(ready).toHaveBeenCalled());
    const readyCount = ready.mock.calls.length;
    const state = store.cardStore.getState();
    const parse = vi.spyOn(documents, "parseLocalCardDocuments");
    await enableNetwork(connection.db);
    await vi.waitFor(() => expect(ready.mock.calls.length).toBeGreaterThan(readyCount));
    expect(store.cardStore.getState()).toBe(state);
    expect(parse.mock.calls.flatMap(([values]) => values)).toEqual([]);
    expect(errors).toEqual([]);
    expect(await indexedDB.databases()).toEqual([]);
  });
});
