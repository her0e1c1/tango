/**
 * @file Verifies the "firestore/rule" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "should read a deck",
 * "should create a deck", "should update a deck".
 */

import { it, describe, beforeEach, beforeAll, afterAll } from "vitest";
import * as fs from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { v4 as uuid } from "uuid";

describe("firestore/rule", () => {
  let testEnv: RulesTestEnvironment;

  const createData = async (path: string, id: string, data: object) => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, path, id), data);
    });
  };

  const studyAttemptData = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
    uid: "uid",
    sessionId: "session-id",
    deckId: "deck-id",
    cardId: "card-id",
    outcome: "mastered",
    answeredAt: Timestamp.now(),
    localDate: "2026-08-10",
    timeZone: "Asia/Tokyo",
    schemaVersion: 1,
    ...overrides,
  });

  const createStudyDependencies = async (overrides: { deckUid?: string; cardUid?: string; deckId?: string } = {}) => {
    const deckId = overrides.deckId ?? "deck-id";
    await createData("deck", deckId, { uid: overrides.deckUid ?? "uid" });
    await createData("card", "card-id", { uid: overrides.cardUid ?? "uid", deckId });
  };

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "test-rule",
      firestore: {
        rules: fs.readFileSync("./firestore.rules", "utf8"),
        host: import.meta.env.VITE_DB_HOST,
        port: parseInt(import.meta.env.VITE_DB_PORT, 10),
      },
    });
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  describe("authenticated context", () => {
    let db: firebase.default.firestore.Firestore;

    beforeEach(async () => {
      db = testEnv.authenticatedContext("uid").firestore();
    });

    describe("deck", () => {
      it("should read a deck", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid", isPublic: false });
        await assertSucceeds(getDoc(doc(db, "deck", id)));
      });

      it("should create a deck", async () => {
        const id = uuid();
        await assertSucceeds(setDoc(doc(db, "deck", id), { uid: "uid" }));
      });

      it("should update a deck", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid" });
        await assertSucceeds(updateDoc(doc(db, "deck", id), { uid: "uid", name: "update" }));
      });

      it("should delete a deck", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid" });
        await assertSucceeds(deleteDoc(doc(db, "deck", id)));
      });
    });

    describe("card", () => {
      it("should read a card", async () => {
        const id = uuid();
        await createData("card", id, { uid: "uid" });
        await assertSucceeds(getDoc(doc(db, "card", id)));
      });

      it("should create a card", async () => {
        const [deckId, id] = [uuid(), uuid()];
        await createData("deck", deckId, { uid: "uid" });
        await assertSucceeds(setDoc(doc(db, "card", id), { uid: "uid", deckId }));
      });

      it("should update a card", async () => {
        const [deckId, id] = [uuid(), uuid()];
        await createData("deck", deckId, { uid: "uid" });
        await createData("card", id, { uid: "uid" });
        await assertSucceeds(updateDoc(doc(db, "card", id), { uid: "uid", deckId }));
      });

      it("should delete a card", async () => {
        const id = uuid();
        await createData("card", id, { uid: "uid" });
        await assertSucceeds(deleteDoc(doc(db, "card", id)));
      });
    });

    describe("studyAttempt", () => {
      it("allows an owner to create and read a valid attempt", async () => {
        await createStudyDependencies();
        const data = studyAttemptData();

        await assertSucceeds(setDoc(doc(db, "studyAttempt", "attempt-id"), data));
        await assertSucceeds(getDoc(doc(db, "studyAttempt", "attempt-id")));
      });

      it("allows only an exact retry of an existing attempt", async () => {
        await createStudyDependencies();
        const ref = doc(db, "studyAttempt", "attempt-id");
        const data = studyAttemptData();
        await assertSucceeds(setDoc(ref, data));

        await assertSucceeds(setDoc(ref, data));
        await assertFails(setDoc(ref, { ...data, outcome: "notMastered" }));
      });

      it.each([
        ["foreign owner", { uid: "other" }],
        ["empty session ID", { sessionId: "" }],
        ["unknown outcome", { outcome: "unknown" }],
        ["unknown schema", { schemaVersion: 2 }],
        ["missing field", { sessionId: null }],
        ["extra field", { unexpected: true }],
        ["non-timestamp answer time", { answeredAt: Date.now() }],
        ["old timestamp", { answeredAt: Timestamp.fromMillis(Date.UTC(1999, 11, 31, 23, 59, 59)) }],
        ["future timestamp", { answeredAt: Timestamp.fromMillis(Date.now() + 11 * 60 * 1_000) }],
        ["invalid local date", { localDate: "2026/08/10" }],
        ["empty time zone", { timeZone: "" }],
      ])("rejects a %s payload", async (_name, overrides) => {
        await createStudyDependencies();
        const data = studyAttemptData(overrides);
        if ("sessionId" in overrides && overrides.sessionId === null) delete data.sessionId;

        await assertFails(setDoc(doc(db, "studyAttempt", uuid()), data));
      });

      it("rejects Card and Deck ownership or membership mismatches", async () => {
        await createStudyDependencies({ cardUid: "other" });
        await assertFails(setDoc(doc(db, "studyAttempt", "foreign-card"), studyAttemptData()));

        await createData("card", "card-id", { uid: "uid", deckId: "other-deck" });
        await createData("deck", "other-deck", { uid: "other" });
        await assertFails(setDoc(doc(db, "studyAttempt", "foreign-deck"), studyAttemptData({ deckId: "other-deck" })));
      });

      it("denies deletion", async () => {
        await createStudyDependencies();
        const ref = doc(db, "studyAttempt", "attempt-id");
        await assertSucceeds(setDoc(ref, studyAttemptData()));

        await assertFails(deleteDoc(ref));
      });

      it("requires an owner UID filter and the hard query limit", async () => {
        await createStudyDependencies();
        await assertSucceeds(setDoc(doc(db, "studyAttempt", "attempt-id"), studyAttemptData()));

        const attempts = collection(db, "studyAttempt");
        await assertSucceeds(getDocs(query(attempts, where("uid", "==", "uid"), limit(6_001))));
        await assertFails(getDocs(query(attempts, limit(6_001))));
        await assertFails(getDocs(query(attempts, where("uid", "==", "uid"), limit(6_002))));
      });
    });
  });

  describe("invalid authenticated context", () => {
    let db: firebase.default.firestore.Firestore;

    beforeEach(async () => {
      db = testEnv.authenticatedContext("invalid").firestore();
    });

    describe("deck", () => {
      it("should not read a deck", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid" });
        await assertFails(getDoc(doc(db, "deck", id)));
      });

      it("should read a publick deck", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid", isPublic: true });
        await assertSucceeds(getDoc(doc(db, "deck", id)));
      });

      it("should not create a deck", async () => {
        const id = uuid();
        await assertFails(setDoc(doc(db, "deck", id), { uid: "uid" }));
      });

      it("should not update a deck", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid" });
        await assertFails(updateDoc(doc(db, "deck", id), { uid: "uid", name: "update" }));
      });

      it("should not delete a deck", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid" });
        await assertFails(deleteDoc(doc(db, "deck", id)));
      });
    });

    describe("card", () => {
      it("should not read a card", async () => {
        const id = uuid();
        await createData("card", id, { uid: "uid" });
        await assertFails(getDoc(doc(db, "card", id)));
      });

      it("should read a public card", async () => {
        const [deckId, id] = [uuid(), uuid()];
        await createData("deck", deckId, { uid: "uid", isPublic: true });
        await createData("card", id, { uid: "uid", deckId });
        await assertSucceeds(getDoc(doc(db, "card", id)));
      });

      it("should not create a card", async () => {
        const id = uuid();
        await assertFails(setDoc(doc(db, "card", id), { uid: "uid" }));
      });

      it("should not update a card", async () => {
        const id = uuid();
        await createData("card", id, { uid: "uid" });
        await assertFails(updateDoc(doc(db, "card", id), { uid: "uid", name: "update" }));
      });

      it("should not delete a card", async () => {
        const id = uuid();
        await createData("card", id, { uid: "uid" });
        await assertFails(deleteDoc(doc(db, "card", id)));
      });
    });

    describe("studyAttempt", () => {
      it("cannot read or create another user's attempt", async () => {
        await createStudyDependencies();
        await createData("studyAttempt", "attempt-id", studyAttemptData());

        await assertFails(getDoc(doc(db, "studyAttempt", "attempt-id")));
        await assertFails(setDoc(doc(db, "studyAttempt", "other-attempt"), studyAttemptData()));
      });
    });
  });

  describe("unauthenticated context", () => {
    let db: firebase.default.firestore.Firestore;

    beforeEach(async () => {
      db = testEnv.unauthenticatedContext().firestore();
    });

    describe("deck", () => {
      it("should not read a deck", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid" });
        await assertFails(getDoc(doc(db, "deck", id)));
      });

      it("should read a publick deck", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid", isPublic: true });
        await assertSucceeds(getDoc(doc(db, "deck", id)));
      });

      it("should not create a deck", async () => {
        const id = uuid();
        await assertFails(setDoc(doc(db, "deck", id), { uid: "uid" }));
      });

      it("should not update a deck", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid" });
        await assertFails(updateDoc(doc(db, "deck", id), { uid: "uid", name: "update" }));
      });

      it("should not delete a deck", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid" });
        await assertFails(deleteDoc(doc(db, "deck", id)));
      });
    });

    describe("card", () => {
      it("should not read a card", async () => {
        const id = uuid();
        await createData("card", id, { uid: "uid" });
        await assertFails(getDoc(doc(db, "card", id)));
      });

      it("should read a public card", async () => {
        const [deckId, id] = [uuid(), uuid()];
        await createData("deck", deckId, { uid: "uid", isPublic: true });
        await createData("card", id, { uid: "uid", deckId });
        await assertSucceeds(getDoc(doc(db, "card", id)));
      });

      it("should not create a card", async () => {
        const id = uuid();
        await assertFails(setDoc(doc(db, "card", id), { uid: "uid" }));
      });

      it("should not update a card", async () => {
        const id = uuid();
        await createData("card", id, { uid: "uid" });
        await assertFails(updateDoc(doc(db, "card", id), { uid: "uid", name: "update" }));
      });

      it("should not delete a card", async () => {
        const id = uuid();
        await createData("card", id, { uid: "uid" });
        await assertFails(deleteDoc(doc(db, "card", id)));
      });
    });

    describe("studyAttempt", () => {
      it("cannot read or create an attempt", async () => {
        await createStudyDependencies();
        await createData("studyAttempt", "attempt-id", studyAttemptData());

        await assertFails(getDoc(doc(db, "studyAttempt", "attempt-id")));
        await assertFails(setDoc(doc(db, "studyAttempt", "other-attempt"), studyAttemptData()));
      });
    });
  });
});
