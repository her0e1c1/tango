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
import { setDoc, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import * as UUID from "uuid";

const uuid = UUID.v4;

describe("firestore/rule", () => {
  let testEnv: RulesTestEnvironment;

  const createData = async (path: string, id: string, data: object) => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, path, id), data);
    });
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

      it("should reserve physical deck deletion for the server", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid" });
        await assertFails(deleteDoc(doc(db, "deck", id)));
      });

      it("should reserve deck deletion state for the server", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid", deletedAt: null });

        await assertFails(updateDoc(doc(db, "deck", id), { deletionState: "deleting", deletedAt: 2 }));
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

      it("should reject card creation while its deck is deleting", async () => {
        const [deckId, id] = [uuid(), uuid()];
        await createData("deck", deckId, {
          uid: "uid",
          deletionState: "deleting",
          deletedAt: 2,
        });

        await assertFails(setDoc(doc(db, "card", id), { uid: "uid", deckId }));
      });

      it("should reject card updates while its deck is deleting", async () => {
        const [deckId, id] = [uuid(), uuid()];
        await createData("deck", deckId, {
          uid: "uid",
          deletionState: "deleting",
          deletedAt: 2,
        });
        await createData("card", id, { uid: "uid", deckId });

        await assertFails(updateDoc(doc(db, "card", id), { name: "update" }));
      });
    });
  });

  it("rejects independent clients racing card writes after deletion begins", async () => {
    const [deckId, existingCardId, newCardId] = [uuid(), uuid(), uuid()];
    await createData("deck", deckId, {
      uid: "uid",
      deletionState: "deleting",
      deletedAt: 2,
    });
    await createData("card", existingCardId, { uid: "uid", deckId });
    const firstClient = testEnv.authenticatedContext("uid").firestore();
    const secondClient = testEnv.authenticatedContext("uid").firestore();

    await Promise.all([
      assertFails(setDoc(doc(firstClient, "card", newCardId), { uid: "uid", deckId })),
      assertFails(updateDoc(doc(secondClient, "card", existingCardId), { name: "racing update" })),
    ]);
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

      it("should read a public deck", async () => {
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

      it("should read a public deck", async () => {
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
  });
});
