import fs from "node:fs";
import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { beforeAll, beforeEach, afterAll, afterEach, describe, expect, it, vi } from "vitest";
import {
  collection,
  disableNetwork,
  enableNetwork,
  doc,
  getDocs,
  query,
  setDoc,
  where,
  waitForPendingWrites,
  type Firestore,
} from "firebase/firestore";
import {
  calculateFsrsState,
  getCardStudyState,
  getStudyCards,
  deleteCardStudyStates,
} from "@/entities/card-study-state";
import { cardStudyStateId } from "@/entities/card-study-state/api/id";
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

describe("CardStudyState persistence", () => {
  let environment: RulesTestEnvironment;
  let uid: string;
  let stop: () => void = () => undefined;
  const fsrs = calculateFsrsState(null, "easy", 1000);
  const state = (cardId = "card", deckId = "deck") => ({
    schemaVersion: 1,
    uid,
    cardId,
    deckId,
    fsrs,
    createdAt: 1000,
    updatedAt: 1000,
  });
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
      projectId: "test-card-study-state",
      firestore: {
        rules: fs.readFileSync("firestore.rules", "utf8"),
        host: import.meta.env.VITE_DB_HOST,
        port: Number(import.meta.env.VITE_DB_PORT),
      },
    });
  });
  beforeEach(() => {
    uid = crypto.randomUUID();
    connection.uid = uid;
    connection.db = environment
      .authenticatedContext(uid, { firebase: { sign_in_provider: "google.com", identities: {} } })
      .firestore() as unknown as Firestore;
  });
  afterEach(() => {
    stop();
  });
  afterAll(async () => {
    await environment.cleanup();
  });

  it("[FIRESTORE-CARD-STUDY-STATE-01] treats missing and null state as unrated without copying legacy Card values", async () => {
    await seed("deck", "deck", { ...createDeck({ id: "deck", uid }), deletedAt: null });
    await seed("card", "card", {
      ...createCard({ id: "card", deckId: "deck", uid }),
      difficulty: 9,
      numberOfSeen: 50,
      lastSeenAt: 1000,
      studySchedule: { version: 1, ...fsrs },
    });
    await start();
    expect(getStudyCards()).toMatchObject([{ id: "card", fsrs: null }]);
    expect((await getDocs(query(collection(connection.db, "cardStudyState"), where("uid", "==", uid)))).empty).toBe(
      true
    );
    await seed("cardStudyState", cardStudyStateId(uid, "card"), { ...state(), fsrs: null });
    await vi.waitFor(() => expect(getCardStudyState("card")?.fsrs).toBeNull());
    expect(getStudyCards()).toMatchObject([{ id: "card", fsrs: null }]);
  });
  it("[FIRESTORE-CARD-STUDY-STATE-02] restores only the active UID and clears state on stop", async () => {
    await seed("cardStudyState", cardStudyStateId(uid, "card"), state());
    await seed("cardStudyState", cardStudyStateId("other", "foreign"), { ...state("foreign"), uid: "other" });
    await start();
    expect(getCardStudyState("card")?.fsrs).toEqual(fsrs);
    expect(getCardStudyState("foreign")).toBeUndefined();
    stop();
    expect(getCardStudyState("card")).toBeUndefined();
  });
  it.each(["version", "difficulty", "extra", "lapses", "NaN"])(
    "[FIRESTORE-CARD-STUDY-STATE-03] rejects invalid persisted state: %s",
    async (kind) => {
      const changes =
        kind === "version"
          ? { schemaVersion: 2 }
          : kind === "extra"
            ? { extra: true }
            : {
                fsrs: {
                  ...fsrs,
                  ...(kind === "difficulty"
                    ? { difficulty: 0 }
                    : kind === "lapses"
                      ? { lapses: 2 }
                      : { stability: Number.NaN }),
                },
              };
      await seed("cardStudyState", cardStudyStateId(uid, "card"), { ...state(), ...changes });
      await expect(start()).rejects.toBeDefined();
      expect(() => getCardStudyState("card")).toThrow();
    }
  );
  it("[FIRESTORE-CARD-STUDY-STATE-04] cleans up only existing state for the requested Card or Deck", async () => {
    for (const [id, deck] of [
      ["first", "deck"],
      ["second", "deck"],
      ["third", "another"],
    ] as const)
      await seed("cardStudyState", cardStudyStateId(uid, id), state(id, deck));
    await start();
    await deleteCardStudyStates(uid, { cardId: "first" });
    await deleteCardStudyStates(uid, { cardId: "missing" });
    await vi.waitFor(() => expect(getCardStudyState("first")).toBeUndefined());
    expect(getCardStudyState("second")).toBeDefined();
    await deleteCardStudyStates(uid, { deckId: "deck", cardIds: ["second"] });
    await waitForPendingWrites(connection.db);
    const saved = await getDocs(query(collection(connection.db, "cardStudyState"), where("uid", "==", uid)));
    expect(saved.docs.map((item) => item.data().cardId)).toEqual(["third"]);
  });
  it("[FIRESTORE-CARD-STUDY-STATE-05] surfaces a denied subscription instead of an empty state", async () => {
    await expect(start("another-owner")).rejects.toBeDefined();
    await vi.waitFor(() => expect(() => getCardStudyState("card")).toThrow());
  });
  it("[FIRESTORE-CARD-STUDY-STATE-06] deletes uncached server state and tolerates missing state", async () => {
    await seed("cardStudyState", cardStudyStateId(uid, "uncached"), state("uncached"));
    await disableNetwork(connection.db);
    expect(getCardStudyState("uncached")).toBeUndefined();
    await deleteCardStudyStates(uid, { cardId: "uncached" });
    await deleteCardStudyStates(uid, { cardId: "missing" });
    await enableNetwork(connection.db);
    await waitForPendingWrites(connection.db);
    const saved = await getDocs(query(collection(connection.db, "cardStudyState"), where("uid", "==", uid)));
    expect(saved.empty).toBe(true);
  });
});
