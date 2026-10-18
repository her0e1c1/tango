import fs from "node:fs";
import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { beforeAll, beforeEach, afterAll, afterEach, describe, expect, it, vi } from "vitest";
import {
  disableNetwork,
  enableNetwork,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  waitForPendingWrites,
  type Firestore,
} from "firebase/firestore";
import { calculateFsrsState, getCards, deleteCard, editCard } from "@/entities/card";
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
      await setDoc(doc(context.firestore(), collectionName, id), { ...data, updatedAt: serverTimestamp() });
    });
  const start = (owner = uid) => {
    const subscription = startFirestoreSubscriptions(owner);
    stop = subscription.stop;
    return subscription.ready;
  };
  beforeAll(async () => {
    // Given: Establish the shared setup used by the following cases.
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
    // Given: Establish the shared setup used by the following cases.
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
    // Given: Use this case's inputs and any shared test setup.
    await seed("card", "card", createCard({ id: "card", deckId: "deck", uid }));
    // When: Subscribe to Cards for the active owner.
    await start();
    // Then: Verify the expected result in the assertions below.
    expect(getCards()).toMatchObject([{ id: "card", fsrs: null }]);
    // When: Exercise `editCard` with the prepared inputs.
    await editCard(uid, { id: "card", fsrs });
    // Then: Verify the expected result in the assertions below.
    await vi.waitFor(() => expect(getCards()).toMatchObject([{ id: "card", fsrs, updatedAt: expect.any(Number) }]));
  });
  it("[FIRESTORE-CARD-FSRS-02] restores only the active UID and clears Cards on stop", async () => {
    // Given: Use this case's inputs and any shared test setup.
    await seed("card", "card", createCard({ id: "card", deckId: "deck", uid, fsrs }));
    await seed("card", "foreign", createCard({ id: "foreign", uid: "other", fsrs }));
    // When: Subscribe to Cards for the active owner.
    await start();
    // Then: Verify the expected result in the assertions below.
    expect(getCards()).toMatchObject([{ id: "card", fsrs }]);
    // When: Exercise `stop` with the prepared inputs.
    stop();
    // Then: Verify the expected result in the assertions below.
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
    // Given: Use this case's inputs and any shared test setup.
    await setDoc(doc(connection.db, "card", "card"), {
      ...createCard({ id: "card", deckId: "deck", uid }),
      fsrs: invalid,
      updatedAt: serverTimestamp(),
    });
    // When: Start a subscription with the invalid persisted FSRS fixture.
    // Then: Report the invalid state and leave Cards empty.
    await expect(start()).rejects.toBeDefined();
    expect(getCards()).toEqual([]);
  });
  it("[FIRESTORE-CARD-FSRS-04] hides deleted Card state without changing other Cards", async () => {
    // Given: Use this case's inputs and any shared test setup.
    for (const id of ["first", "second"]) await seed("card", id, createCard({ id, deckId: "deck", uid, fsrs }));
    await start();
    // When: Exercise `deleteCard` with the prepared inputs.
    await deleteCard(uid, "first");
    // Then: Verify the expected result in the assertions below.
    await vi.waitFor(() => expect(getCards().map((card) => card.id)).toEqual(["second"]));
    expect(getCards()[0]?.fsrs).toEqual(fsrs);
  });
  it("[FIRESTORE-CARD-FSRS-05] surfaces a denied subscription", async () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Subscribe using an unauthorized owner.
    // Then: Report the denied subscription.
    await expect(start("another-owner")).rejects.toBeDefined();
  });
  it("[FIRESTORE-CARD-FSRS-06] preserves offline deletion after reconnect", async () => {
    // Given: Prepare `settled` and any shared test state below.
    await seed("card", "card", createCard({ id: "card", deckId: "deck", uid, fsrs }));
    await start();
    await disableNetwork(connection.db);
    let settled = false;
    // When: Exercise `deleteCard(uid, "card").then` with the prepared inputs.
    const deletion = deleteCard(uid, "card").then(() => {
      settled = true;
    });
    // Then: Verify the expected result in the assertions below.
    expect(getCards()).toMatchObject([{ id: "card", fsrs }]);
    expect(settled).toBe(false);
    // When: Exercise `enableNetwork` with the prepared inputs.
    await enableNetwork(connection.db);
    await deletion;
    // Then: Verify the expected result in the assertions below.
    await vi.waitFor(() => expect(getCards()).toEqual([]));
    await waitForPendingWrites(connection.db);
    expect((await getDoc(doc(connection.db, "card", "card"))).data()?.deletedAt).toEqual(expect.any(Number));
  });
});
