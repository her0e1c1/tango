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
import {
  setDoc,
  writeBatch,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  collection as firestoreCollection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import * as Uuid from "uuid";

const uuid = Uuid.v4;

describe("Firestore ownership and guest write restrictions", () => {
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

  describe("StudySession", () => {
    const sessionData = () => ({
      uid: "uid",
      deckId: "public-deck",
      cardOrderIds: ["first", "second"],
      currentIndex: 0,
      startedAt: Timestamp.fromMillis(1000),
      endedAt: null,
      endReason: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const ownerDb = () =>
      testEnv
        .authenticatedContext("uid", {
          firebase: { sign_in_provider: "google.com", identities: {} },
        })
        .firestore();

    it("[FIRESTORE-RULES-01] allows the owner to create, resume and complete a private session", async () => {
      const db = ownerDb();
      const reference = doc(db, "studySession", uuid());
      await assertSucceeds(setDoc(reference, sessionData()));
      await assertSucceeds(getDoc(reference));
      await assertSucceeds(getDocs(query(firestoreCollection(db, "studySession"), where("uid", "==", "uid"))));
      await assertSucceeds(updateDoc(reference, { currentIndex: 1, updatedAt: serverTimestamp() }));
      await assertSucceeds(
        updateDoc(reference, { endReason: "completed", endedAt: serverTimestamp(), updatedAt: serverTimestamp() })
      );
    });

    it.each(["other-user", "anonymous", "unauthenticated"])(
      "[FIRESTORE-RULES-02] denies %s access even when the Deck is public",
      async (actor) => {
        const id = uuid();
        await createData("deck", "public-deck", { uid: "uid", isPublic: true });
        await createData("studySession", id, sessionData());
        const db =
          actor === "unauthenticated"
            ? testEnv.unauthenticatedContext().firestore()
            : testEnv
                .authenticatedContext(actor === "anonymous" ? "uid" : actor, {
                  firebase: { sign_in_provider: actor === "anonymous" ? "anonymous" : "google.com", identities: {} },
                })
                .firestore();
        const reference = doc(db, "studySession", id);
        await assertFails(getDoc(reference));
        await assertFails(getDocs(query(firestoreCollection(db, "studySession"), where("uid", "==", "uid"))));
        await assertFails(setDoc(doc(db, "studySession", uuid()), sessionData()));
        await assertFails(updateDoc(reference, { currentIndex: 1, updatedAt: serverTimestamp() }));
        await assertFails(deleteDoc(reference));
      }
    );

    it("[FIRESTORE-RULES-03] rejects ownership changes and deletion", async () => {
      const reference = doc(ownerDb(), "studySession", uuid());
      await setDoc(reference, sessionData());
      await assertFails(updateDoc(reference, { uid: "another-user", updatedAt: serverTimestamp() }));
      await assertFails(deleteDoc(reference));
    });
  });

  describe("Deleted public content", () => {
    it.each(["other-user", "anonymous", "unauthenticated"])("[FIRESTORE-RULES-04] rejects %s", async (actor) => {
      await createData("deck", "deleted", { uid: "owner", isPublic: true, deletedAt: 1000 });
      await createData("deck", "active", { uid: "owner", isPublic: true, deletedAt: null });
      await createData("card", "child", { uid: "owner", deckId: "deleted", deletedAt: null });
      await createData("card", "deleted-card", { uid: "owner", deckId: "active", deletedAt: 1000 });
      const db =
        actor === "unauthenticated"
          ? testEnv.unauthenticatedContext().firestore()
          : testEnv
              .authenticatedContext(actor, {
                firebase: { sign_in_provider: actor === "anonymous" ? "anonymous" : "google.com", identities: {} },
              })
              .firestore();
      await assertFails(getDoc(doc(db, "deck", "deleted")));
      await assertFails(getDoc(doc(db, "card", "child")));
      await assertFails(getDoc(doc(db, "card", "deleted-card")));
      await assertSucceeds(getDoc(doc(db, "deck", "active")));
    });
  });

  describe("Rating answer batches", () => {
    const answer = (cardId = "first") => ({
      uid: "owner",
      sessionId: "session",
      deckId: "deck",
      cardId,
      answer: { type: "rating", rating: "good" },
      answeredAt: Timestamp.fromMillis(2000),
      createdAt: Timestamp.fromMillis(2000),
      updatedAt: Timestamp.fromMillis(2000),
    });
    const ownerDb = () =>
      testEnv
        .authenticatedContext("owner", { firebase: { sign_in_provider: "google.com", identities: {} } })
        .firestore();
    beforeEach(async () => {
      await createData("deck", "deck", { uid: "owner", isPublic: false });
      for (const id of ["first", "last"])
        await createData("card", id, { uid: "owner", deckId: "deck", numberOfSeen: 0 });
      await createData("studySession", "session", {
        uid: "owner",
        deckId: "deck",
        cardOrderIds: ["first", "last"],
        currentIndex: 0,
        endReason: null,
        endedAt: null,
      });
    });
    it("[FIRESTORE-RULES-05] accepts the first and final answer with atomic Card and session updates", async () => {
      const db = ownerDb();
      for (const [index, cardId] of ["first", "last"].entries()) {
        const batch = writeBatch(db);
        batch.set(doc(db, "studyAnswer", `session-${String(index)}`), answer(cardId));
        batch.update(doc(db, "card", cardId), { numberOfSeen: 1, lastSeenAt: 2000, updatedAt: 2000 });
        batch.update(doc(db, "studySession", "session"), {
          currentIndex: 1,
          ...(index === 1 ? { endReason: "completed", endedAt: Timestamp.fromMillis(2000) } : {}),
          updatedAt: Timestamp.fromMillis(2000),
        });
        await assertSucceeds(batch.commit());
        await assertSucceeds(getDoc(doc(db, "studyAnswer", `session-${String(index)}`)));
      }
    });
    it("[FIRESTORE-RULES-06] leaves answer sequencing to the application", async () => {
      const db = ownerDb();
      await assertSucceeds(setDoc(doc(db, "studyAnswer", "standalone"), answer("last")));
      await updateDoc(doc(db, "studySession", "session"), { endReason: "completed" });
      await assertSucceeds(setDoc(doc(db, "studyAnswer", "another-id"), answer("last")));
    });
    it("[FIRESTORE-RULES-07] forbids rewriting or deleting answer history", async () => {
      const db = ownerDb();
      await createData("studyAnswer", "saved", answer());
      await assertFails(updateDoc(doc(db, "studyAnswer", "saved"), { answer: { type: "rating", rating: "again" } }));
      await assertFails(deleteDoc(doc(db, "studyAnswer", "saved")));
    });
    it.each(["other-user", "anonymous"])("[FIRESTORE-RULES-08] rejects %s reads and answer batches", async (actor) => {
      await createData("studyAnswer", "saved", answer());
      const db = testEnv
        .authenticatedContext(actor === "anonymous" ? "owner" : actor, {
          firebase: { sign_in_provider: actor === "anonymous" ? "anonymous" : "google.com", identities: {} },
        })
        .firestore();
      await assertFails(getDoc(doc(db, "studyAnswer", "saved")));
      const batch = writeBatch(db);
      batch.set(doc(db, "studyAnswer", "new"), answer());
      batch.update(doc(db, "card", "first"), { numberOfSeen: 1 });
      batch.update(doc(db, "studySession", "session"), { currentIndex: 1 });
      await assertFails(batch.commit());
    });
  });

  describe("authenticated context", () => {
    let db: firebase.default.firestore.Firestore;

    beforeEach(() => {
      db = testEnv
        .authenticatedContext("uid", { firebase: { sign_in_provider: "google.com", identities: {} } })
        .firestore();
    });

    describe("deck", () => {
      it("[FIRESTORE-RULES-09] should read a deck", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid", isPublic: false });
        await assertSucceeds(getDoc(doc(db, "deck", id)));
      });

      it("[FIRESTORE-RULES-10] should create a deck", async () => {
        const id = uuid();
        await assertSucceeds(setDoc(doc(db, "deck", id), { uid: "uid" }));
      });

      it("[FIRESTORE-RULES-11] should update a deck", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid" });
        await assertSucceeds(updateDoc(doc(db, "deck", id), { uid: "uid", name: "update" }));
      });

      it("[FIRESTORE-RULES-12] should delete a deck", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid" });
        await assertSucceeds(deleteDoc(doc(db, "deck", id)));
      });
    });

    describe("card", () => {
      it("[FIRESTORE-RULES-13] should read a card", async () => {
        const id = uuid();
        await createData("card", id, { uid: "uid" });
        await assertSucceeds(getDoc(doc(db, "card", id)));
      });

      it("[FIRESTORE-RULES-14] should create a card", async () => {
        const [deckId, id] = [uuid(), uuid()];
        await createData("deck", deckId, { uid: "uid" });
        await assertSucceeds(setDoc(doc(db, "card", id), { uid: "uid", deckId }));
      });

      it("[FIRESTORE-RULES-15] should update a card", async () => {
        const [deckId, id] = [uuid(), uuid()];
        await createData("deck", deckId, { uid: "uid" });
        await createData("card", id, { uid: "uid" });
        await assertSucceeds(updateDoc(doc(db, "card", id), { uid: "uid", deckId }));
      });

      it("[FIRESTORE-RULES-16] should delete a card", async () => {
        const id = uuid();
        await createData("card", id, { uid: "uid" });
        await assertSucceeds(deleteDoc(doc(db, "card", id)));
      });
    });
  });

  describe("invalid authenticated context", () => {
    let db: firebase.default.firestore.Firestore;

    beforeEach(() => {
      db = testEnv
        .authenticatedContext("invalid", { firebase: { sign_in_provider: "google.com", identities: {} } })
        .firestore();
    });

    describe("deck", () => {
      it("[FIRESTORE-RULES-17] should not read a deck", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid" });
        await assertFails(getDoc(doc(db, "deck", id)));
      });

      it("[FIRESTORE-RULES-18] should read a public deck", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid", isPublic: true });
        await assertSucceeds(getDoc(doc(db, "deck", id)));
      });

      it("[FIRESTORE-RULES-19] should not create a deck", async () => {
        const id = uuid();
        await assertFails(setDoc(doc(db, "deck", id), { uid: "uid" }));
      });

      it("[FIRESTORE-RULES-20] should not update a deck", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid" });
        await assertFails(updateDoc(doc(db, "deck", id), { uid: "uid", name: "update" }));
      });

      it("[FIRESTORE-RULES-21] should not delete a deck", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid" });
        await assertFails(deleteDoc(doc(db, "deck", id)));
      });
    });

    describe("card", () => {
      it("[FIRESTORE-RULES-22] should not read a card", async () => {
        const id = uuid();
        await createData("card", id, { uid: "uid" });
        await assertFails(getDoc(doc(db, "card", id)));
      });

      it("[FIRESTORE-RULES-23] should read a public card", async () => {
        const [deckId, id] = [uuid(), uuid()];
        await createData("deck", deckId, { uid: "uid", isPublic: true });
        await createData("card", id, { uid: "uid", deckId });
        await assertSucceeds(getDoc(doc(db, "card", id)));
      });

      it("[FIRESTORE-RULES-24] should not create a card", async () => {
        const id = uuid();
        await assertFails(setDoc(doc(db, "card", id), { uid: "uid" }));
      });

      it("[FIRESTORE-RULES-25] should not update a card", async () => {
        const id = uuid();
        await createData("card", id, { uid: "uid" });
        await assertFails(updateDoc(doc(db, "card", id), { uid: "uid", name: "update" }));
      });

      it("[FIRESTORE-RULES-26] should not delete a card", async () => {
        const id = uuid();
        await createData("card", id, { uid: "uid" });
        await assertFails(deleteDoc(doc(db, "card", id)));
      });
    });
  });

  describe("anonymous context with a matching owner UID", () => {
    let db: firebase.default.firestore.Firestore;

    beforeEach(() => {
      db = testEnv
        .authenticatedContext("uid", { firebase: { sign_in_provider: "anonymous", identities: {} } })
        .firestore();
    });

    it.each(["deck", "card"])("[FIRESTORE-RULES-27] rejects creating a %s", async (collection) => {
      const deckId = uuid();
      await createData("deck", deckId, { uid: "uid" });
      await assertFails(setDoc(doc(db, collection, uuid()), { uid: "uid", deckId }));
    });

    it.each(["deck", "card"])("[FIRESTORE-RULES-28] rejects updating an existing %s", async (collection) => {
      const [deckId, id] = [uuid(), uuid()];
      await createData("deck", deckId, { uid: "uid" });
      await createData(collection, id, { uid: "uid", deckId });
      await assertFails(updateDoc(doc(db, collection, id), { name: "guest update" }));
    });

    it.each(["deck", "card"])("[FIRESTORE-RULES-29] rejects deleting an existing %s", async (collection) => {
      const id = uuid();
      await createData(collection, id, { uid: "uid" });
      await assertFails(deleteDoc(doc(db, collection, id)));
    });

    it.each(["deck", "card"])("[FIRESTORE-RULES-30] preserves public %s reads", async (collection) => {
      const deckId = uuid();
      const cardId = uuid();
      await createData("deck", deckId, { uid: "another-user", isPublic: true });
      await createData("card", cardId, { uid: "another-user", deckId });
      await assertSucceeds(getDoc(doc(db, collection, collection === "deck" ? deckId : cardId)));
    });
  });

  describe("unauthenticated context", () => {
    let db: firebase.default.firestore.Firestore;

    beforeEach(() => {
      db = testEnv.unauthenticatedContext().firestore();
    });

    describe("deck", () => {
      it("[FIRESTORE-RULES-31] should not read a deck", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid" });
        await assertFails(getDoc(doc(db, "deck", id)));
      });

      it("[FIRESTORE-RULES-32] should read a public deck", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid", isPublic: true });
        await assertSucceeds(getDoc(doc(db, "deck", id)));
      });

      it("[FIRESTORE-RULES-33] should not create a deck", async () => {
        const id = uuid();
        await assertFails(setDoc(doc(db, "deck", id), { uid: "uid" }));
      });

      it("[FIRESTORE-RULES-34] should not update a deck", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid" });
        await assertFails(updateDoc(doc(db, "deck", id), { uid: "uid", name: "update" }));
      });

      it("[FIRESTORE-RULES-35] should not delete a deck", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid" });
        await assertFails(deleteDoc(doc(db, "deck", id)));
      });
    });

    describe("card", () => {
      it("[FIRESTORE-RULES-36] should not read a card", async () => {
        const id = uuid();
        await createData("card", id, { uid: "uid" });
        await assertFails(getDoc(doc(db, "card", id)));
      });

      it("[FIRESTORE-RULES-37] should read a public card", async () => {
        const [deckId, id] = [uuid(), uuid()];
        await createData("deck", deckId, { uid: "uid", isPublic: true });
        await createData("card", id, { uid: "uid", deckId });
        await assertSucceeds(getDoc(doc(db, "card", id)));
      });

      it("[FIRESTORE-RULES-38] should not create a card", async () => {
        const id = uuid();
        await assertFails(setDoc(doc(db, "card", id), { uid: "uid" }));
      });

      it("[FIRESTORE-RULES-39] should not update a card", async () => {
        const id = uuid();
        await createData("card", id, { uid: "uid" });
        await assertFails(updateDoc(doc(db, "card", id), { uid: "uid", name: "update" }));
      });

      it("[FIRESTORE-RULES-40] should not delete a card", async () => {
        const id = uuid();
        await createData("card", id, { uid: "uid" });
        await assertFails(deleteDoc(doc(db, "card", id)));
      });
    });
  });
});
