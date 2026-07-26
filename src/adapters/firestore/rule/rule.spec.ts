/** @file Verifies ownership, public reads, and the server-only Deck deletion boundary. */

import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import * as fs from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { v4 as uuid } from "uuid";

describe("firestore/rule", () => {
  let testEnv: RulesTestEnvironment;

  const createData = async (path: string, id: string, data: object) => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), path, id), data);
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

  describe("authenticated owner", () => {
    let db: firebase.default.firestore.Firestore;

    beforeEach(() => {
      db = testEnv.authenticatedContext("uid").firestore();
    });

    it("reads, creates, and updates an owned Deck", async () => {
      const existingId = uuid();
      await createData("deck", existingId, { uid: "uid", isPublic: false });

      await assertSucceeds(getDoc(doc(db, "deck", existingId)));
      await assertSucceeds(setDoc(doc(db, "deck", uuid()), { uid: "uid" }));
      await assertSucceeds(updateDoc(doc(db, "deck", existingId), { uid: "uid", name: "updated" }));
    });

    it("cannot physically delete a Deck from the client", async () => {
      const id = uuid();
      await createData("deck", id, { uid: "uid" });

      await assertFails(deleteDoc(doc(db, "deck", id)));
    });

    it("cannot claim or alter the server deletion state", async () => {
      const id = uuid();
      await createData("deck", id, { uid: "uid", deletedAt: null });

      await assertFails(updateDoc(doc(db, "deck", id), { deletionState: "deleting", deletedAt: Date.now() }));
    });

    it("reads, creates, updates, and deletes an owned Card under an active Deck", async () => {
      const deckId = uuid();
      const cardId = uuid();
      await createData("deck", deckId, { uid: "uid", deletedAt: null });
      await createData("card", cardId, { uid: "uid", deckId });

      await assertSucceeds(getDoc(doc(db, "card", cardId)));
      await assertSucceeds(setDoc(doc(db, "card", uuid()), { uid: "uid", deckId }));
      await assertSucceeds(updateDoc(doc(db, "card", cardId), { uid: "uid", deckId, name: "updated" }));
      await assertSucceeds(deleteDoc(doc(db, "card", cardId)));
    });

    it("blocks Card creation and updates while the parent Deck is deleting", async () => {
      const deckId = uuid();
      const cardId = uuid();
      await createData("deck", deckId, {
        uid: "uid",
        deletedAt: Date.now(),
        deletionState: "deleting",
      });
      await createData("card", cardId, { uid: "uid", deckId });

      await assertFails(setDoc(doc(db, "card", uuid()), { uid: "uid", deckId }));
      await assertFails(updateDoc(doc(db, "card", cardId), { uid: "uid", deckId, name: "late write" }));
    });

    it("does not allow a Card to move to another Deck", async () => {
      const firstDeckId = uuid();
      const secondDeckId = uuid();
      const cardId = uuid();
      await createData("deck", firstDeckId, { uid: "uid" });
      await createData("deck", secondDeckId, { uid: "uid" });
      await createData("card", cardId, { uid: "uid", deckId: firstDeckId });

      await assertFails(updateDoc(doc(db, "card", cardId), { uid: "uid", deckId: secondDeckId }));
    });
  });

  describe("different authenticated user", () => {
    let db: firebase.default.firestore.Firestore;

    beforeEach(() => {
      db = testEnv.authenticatedContext("invalid").firestore();
    });

    it("cannot read, create, update, or delete another user's private Deck", async () => {
      const id = uuid();
      await createData("deck", id, { uid: "uid", isPublic: false });

      await assertFails(getDoc(doc(db, "deck", id)));
      await assertFails(setDoc(doc(db, "deck", uuid()), { uid: "uid" }));
      await assertFails(updateDoc(doc(db, "deck", id), { uid: "uid", name: "updated" }));
      await assertFails(deleteDoc(doc(db, "deck", id)));
    });

    it("can read a public Deck and its Cards but cannot write them", async () => {
      const deckId = uuid();
      const cardId = uuid();
      await createData("deck", deckId, { uid: "uid", isPublic: true });
      await createData("card", cardId, { uid: "uid", deckId });

      await assertSucceeds(getDoc(doc(db, "deck", deckId)));
      await assertSucceeds(getDoc(doc(db, "card", cardId)));
      await assertFails(setDoc(doc(db, "card", uuid()), { uid: "uid", deckId }));
      await assertFails(updateDoc(doc(db, "card", cardId), { uid: "uid", deckId, name: "updated" }));
      await assertFails(deleteDoc(doc(db, "card", cardId)));
    });

    it("cannot read another user's private Card", async () => {
      const deckId = uuid();
      const cardId = uuid();
      await createData("deck", deckId, { uid: "uid", isPublic: false });
      await createData("card", cardId, { uid: "uid", deckId });

      await assertFails(getDoc(doc(db, "card", cardId)));
    });
  });

  describe("unauthenticated user", () => {
    let db: firebase.default.firestore.Firestore;

    beforeEach(() => {
      db = testEnv.unauthenticatedContext().firestore();
    });

    it("can read public Decks and Cards", async () => {
      const deckId = uuid();
      const cardId = uuid();
      await createData("deck", deckId, { uid: "uid", isPublic: true });
      await createData("card", cardId, { uid: "uid", deckId });

      await assertSucceeds(getDoc(doc(db, "deck", deckId)));
      await assertSucceeds(getDoc(doc(db, "card", cardId)));
    });

    it("cannot read private data or perform writes", async () => {
      const deckId = uuid();
      const cardId = uuid();
      await createData("deck", deckId, { uid: "uid", isPublic: false });
      await createData("card", cardId, { uid: "uid", deckId });

      await assertFails(getDoc(doc(db, "deck", deckId)));
      await assertFails(getDoc(doc(db, "card", cardId)));
      await assertFails(setDoc(doc(db, "deck", uuid()), { uid: "uid" }));
      await assertFails(setDoc(doc(db, "card", uuid()), { uid: "uid", deckId }));
      await assertFails(updateDoc(doc(db, "deck", deckId), { uid: "uid", name: "updated" }));
      await assertFails(updateDoc(doc(db, "card", cardId), { uid: "uid", deckId, name: "updated" }));
      await assertFails(deleteDoc(doc(db, "deck", deckId)));
      await assertFails(deleteDoc(doc(db, "card", cardId)));
    });
  });
});
