import fs from "node:fs";
import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { beforeAll, beforeEach, afterAll, afterEach, describe, expect, it, vi } from "vitest";
import {
  disableNetwork,
  enableNetwork,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  waitForPendingWrites,
  type Firestore,
} from "firebase/firestore";
import { calculateFsrsState, getCards, deleteCard } from "@/entities/card";
import { startFirestoreSubscriptions } from "@/app/firestore-subscriptions";
import { createCard, createDeck } from "@/test/factories";

const connection = vi.hoisted(() => ({ db: undefined as unknown as Firestore, uid: "" }));
vi.mock("@/shared/firebase", () => ({
  auth: {
    get currentUser() {
      return { uid: connection.uid };
    },
  },
  get db() {
    return connection.db;
  },
}));

describe("Card FSRS persistence", () => {
  let environment: RulesTestEnvironment;
  let uid: string;
  let stop: () => void = () => undefined;
  const fsrs = calculateFsrsState(null, "easy", 1000);
  const seed = async (collectionName: string, id: string, data: object) =>
    environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), collectionName, id), data);
    });
  const start = (owner = uid) => {
    const subscription = startFirestoreSubscriptions(owner);
    stop = subscription.stop;
    return subscription.ready;
  };
  beforeAll(async () => {
    environment = await initializeTestEnvironment({
      projectId: "test-card-fsrs",
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
    connection.uid = uid;
    connection.db = environment
      .authenticatedContext(uid, { firebase: { sign_in_provider: "google.com", identities: {} } })
      .firestore() as unknown as Firestore;
    await seed("deck", "deck", { ...createDeck({ id: "deck", uid }), deletedAt: null });
  });
  afterEach(() => stop());
  afterAll(async () => {
    await environment.cleanup();
  });

  it("[FIRESTORE-CARD-FSRS-01] restores null and rated Cards through one subscription", async () => {
    await seed("card", "card", createCard({ id: "card", deckId: "deck", uid }));
    await start();
    expect(getCards()).toMatchObject([{ id: "card", fsrs: null }]);
    await updateDoc(doc(connection.db, "card", "card"), { fsrs, updatedAt: 1000 });
    await vi.waitFor(() => expect(getCards()).toMatchObject([{ id: "card", fsrs, updatedAt: 1000 }]));
  });
  it("[FIRESTORE-CARD-FSRS-02] restores only the active UID and clears Cards on stop", async () => {
    await seed("card", "card", createCard({ id: "card", deckId: "deck", uid, fsrs }));
    await seed("card", "foreign", createCard({ id: "foreign", uid: "other", fsrs }));
    await start();
    expect(getCards()).toMatchObject([{ id: "card", fsrs }]);
    stop();
    expect(getCards()).toEqual([]);
  });
  it.each([
    {},
    { ...fsrs, extra: true },
    ...[
      { difficulty: 0 },
      { difficulty: 11 },
      { state: "new" },
      { stability: 0 },
      { stability: Infinity },
      { stability: Number.NaN },
      { dueAt: -1 },
      { dueAt: 253402300800000 },
      { lastReviewedAt: 1.5 },
      { reps: 0 },
      { lapses: fsrs.reps + 1 },
      { learningSteps: 0.5 },
      { scheduledDays: 36501 },
    ].map((invalid) => ({ ...fsrs, ...invalid })),
  ])("[FIRESTORE-CARD-FSRS-03] rejects invalid persisted FSRS: %j", async (invalid) => {
    await setDoc(doc(connection.db, "card", "card"), {
      ...createCard({ id: "card", deckId: "deck", uid }),
      fsrs: invalid,
    });
    await expect(start()).rejects.toBeDefined();
    expect(getCards()).toEqual([]);
  });
  it("[FIRESTORE-CARD-FSRS-04] hides deleted Card state without changing other Cards", async () => {
    for (const id of ["first", "second"]) await seed("card", id, createCard({ id, deckId: "deck", uid, fsrs }));
    await start();
    await deleteCard(uid, "first");
    await vi.waitFor(() => expect(getCards().map((card) => card.id)).toEqual(["second"]));
    expect(getCards()[0]?.fsrs).toEqual(fsrs);
  });
  it("[FIRESTORE-CARD-FSRS-05] surfaces a denied subscription", async () => {
    await expect(start("another-owner")).rejects.toBeDefined();
  });
  it("[FIRESTORE-CARD-FSRS-06] preserves offline deletion after reconnect", async () => {
    await seed("card", "card", createCard({ id: "card", deckId: "deck", uid, fsrs }));
    await start();
    await disableNetwork(connection.db);
    await deleteCard(uid, "card");
    await vi.waitFor(() => expect(getCards()).toEqual([]));
    await enableNetwork(connection.db);
    await waitForPendingWrites(connection.db);
    expect((await getDoc(doc(connection.db, "card", "card"))).data()?.deletedAt).toEqual(expect.any(Number));
  });
});
