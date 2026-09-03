/**
 * @file Verifies the Firestore security-rule contract with automated examples.
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
import { setDoc, doc, getDoc, updateDoc, deleteDoc, deleteField } from "firebase/firestore";
import * as Uuid from "uuid";

const uuid = Uuid.v4;

describe("firestore/rule [DECK-02] [DECK-09] [PERSIST-01]", () => {
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
        port: Number.parseInt(import.meta.env.VITE_DB_PORT, 10),
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

    beforeEach(() => {
      db = testEnv.authenticatedContext("uid").firestore();
    });

    describe("deck", () => {
      it("should read a legacy deck as its owner", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid", isPublic: true });
        await assertSucceeds(getDoc(doc(db, "deck", id)));
      });

      it("should create a deck", async () => {
        const id = uuid();
        await assertSucceeds(setDoc(doc(db, "deck", id), { uid: "uid" }));
      });

      it("should reject obsolete visibility when creating a deck", async () => {
        const id = uuid();
        await assertFails(setDoc(doc(db, "deck", id), { uid: "uid", isPublic: false }));
      });

      it("should update a deck", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid" });
        await assertSucceeds(updateDoc(doc(db, "deck", id), { uid: "uid", name: "update" }));
      });

      it("should reject adding obsolete visibility to a deck", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid" });
        await assertFails(updateDoc(doc(db, "deck", id), { isPublic: false }));
      });

      it("should preserve legacy visibility without allowing it to change or be deleted", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid", isPublic: true, name: "legacy" });

        await assertSucceeds(updateDoc(doc(db, "deck", id), { name: "update" }));
        await assertFails(updateDoc(doc(db, "deck", id), { isPublic: false }));
        await assertFails(updateDoc(doc(db, "deck", id), { isPublic: deleteField() }));
      });

      it("should delete a deck", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid" });
        await assertSucceeds(deleteDoc(doc(db, "deck", id)));
      });
    });

    describe("card", () => {
      it("should read an owned card under a legacy deck", async () => {
        const [deckId, id] = [uuid(), uuid()];
        await createData("deck", deckId, { uid: "uid", isPublic: true });
        await createData("card", id, { uid: "uid", deckId });
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
  });

  describe("invalid authenticated context", () => {
    let db: firebase.default.firestore.Firestore;

    beforeEach(() => {
      db = testEnv.authenticatedContext("invalid").firestore();
    });

    describe("deck", () => {
      it("should not read a deck", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid" });
        await assertFails(getDoc(doc(db, "deck", id)));
      });

      it("should not read a legacy deck marked public", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid", isPublic: true });
        await assertFails(getDoc(doc(db, "deck", id)));
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

      it("should not read a card under a legacy deck marked public", async () => {
        const [deckId, id] = [uuid(), uuid()];
        await createData("deck", deckId, { uid: "uid", isPublic: true });
        await createData("card", id, { uid: "uid", deckId });
        await assertFails(getDoc(doc(db, "card", id)));
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

    beforeEach(() => {
      db = testEnv.unauthenticatedContext().firestore();
    });

    describe("deck", () => {
      it("should not read a deck", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid" });
        await assertFails(getDoc(doc(db, "deck", id)));
      });

      it("should not read a legacy deck marked public", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid", isPublic: true });
        await assertFails(getDoc(doc(db, "deck", id)));
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

      it("should not read a card under a legacy deck marked public", async () => {
        const [deckId, id] = [uuid(), uuid()];
        await createData("deck", deckId, { uid: "uid", isPublic: true });
        await createData("card", id, { uid: "uid", deckId });
        await assertFails(getDoc(doc(db, "card", id)));
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
