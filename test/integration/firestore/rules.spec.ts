/**
 * @file Verifies the Firestore security-rule contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "should read a deck",
 * "should create a deck", "should update a deck".
 */

import { it, describe, beforeEach, beforeAll, afterAll, expect } from "vitest";
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
  deleteField,
  serverTimestamp,
  Timestamp,
  collection as firestoreCollection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import * as Uuid from "uuid";

const uuid = Uuid.v4;
const validFsrs = {
  state: "review",
  difficulty: 5,
  stability: 1,
  dueAt: 86402000,
  lastReviewedAt: 2000,
  reps: 1,
  lapses: 0,
  learningSteps: 0,
  scheduledDays: 1,
};

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

    it("[FIRESTORE-RULES-STUDY-SESSION-01] allows the owner to create, resume and complete a private session", async () => {
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
      "[FIRESTORE-RULES-STUDY-SESSION-02] denies %s access even when the Deck is public",
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

    it("[FIRESTORE-RULES-STUDY-SESSION-03] rejects ownership changes and deletion", async () => {
      const reference = doc(ownerDb(), "studySession", uuid());
      await setDoc(reference, sessionData());
      await assertFails(updateDoc(reference, { uid: "another-user", updatedAt: serverTimestamp() }));
      await assertFails(deleteDoc(reference));
    });
  });

  describe("Deleted public content", () => {
    it.each(["other-user", "anonymous", "unauthenticated"])(
      "[FIRESTORE-RULES-DECK-01] rejects %s from reading a deleted public Deck",
      async (actor) => {
        await createData("deck", "deleted", { uid: "owner", isPublic: true, deletedAt: 1000 });
        await createData("deck", "active", { uid: "owner", isPublic: true, deletedAt: null });
        const db =
          actor === "unauthenticated"
            ? testEnv.unauthenticatedContext().firestore()
            : testEnv
                .authenticatedContext(actor, {
                  firebase: { sign_in_provider: actor === "anonymous" ? "anonymous" : "google.com", identities: {} },
                })
                .firestore();
        await assertFails(getDoc(doc(db, "deck", "deleted")));
        await assertSucceeds(getDoc(doc(db, "deck", "active")));
      }
    );

    it.each(["other-user", "anonymous", "unauthenticated"])(
      "[FIRESTORE-RULES-CARD-01] rejects %s from reading deleted public Card content",
      async (actor) => {
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
        await assertFails(getDoc(doc(db, "card", "child")));
        await assertFails(getDoc(doc(db, "card", "deleted-card")));
      }
    );
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
      for (const id of ["first", "last"]) await createData("card", id, { uid: "owner", deckId: "deck" });
      await createData("studySession", "session", {
        uid: "owner",
        deckId: "deck",
        cardOrderIds: ["first", "last"],
        currentIndex: 0,
        endReason: null,
        endedAt: null,
      });
    });
    it("[FIRESTORE-RULES-STUDY-ANSWER-01] accepts the first and final answer with atomic state and session updates", async () => {
      const db = ownerDb();
      for (const [index, cardId] of ["first", "last"].entries()) {
        const batch = writeBatch(db);
        batch.set(doc(db, "studyAnswer", `session-${String(index)}`), answer(cardId));
        batch.set(doc(db, "cardStudyState", `5:owner${cardId}`), {
          schemaVersion: 1,
          uid: "owner",
          cardId,
          deckId: "deck",
          fsrs: validFsrs,
          createdAt: 2000,
          updatedAt: 2000,
        });
        batch.update(doc(db, "studySession", "session"), {
          currentIndex: 1,
          ...(index === 1 ? { endReason: "completed", endedAt: Timestamp.fromMillis(2000) } : {}),
          updatedAt: Timestamp.fromMillis(2000),
        });
        await assertSucceeds(batch.commit());
        await assertSucceeds(getDoc(doc(db, "studyAnswer", `session-${String(index)}`)));
      }
    });
    it("[FIRESTORE-RULES-STUDY-ANSWER-02] leaves answer sequencing to the application", async () => {
      const db = ownerDb();
      await assertSucceeds(setDoc(doc(db, "studyAnswer", "standalone"), answer("last")));
      await updateDoc(doc(db, "studySession", "session"), { endReason: "completed" });
      await assertSucceeds(setDoc(doc(db, "studyAnswer", "another-id"), answer("last")));
    });
    it("[FIRESTORE-RULES-STUDY-ANSWER-03] forbids rewriting or deleting answer history", async () => {
      const db = ownerDb();
      await createData("studyAnswer", "saved", answer());
      await assertFails(updateDoc(doc(db, "studyAnswer", "saved"), { answer: { type: "rating", rating: "again" } }));
      await assertFails(deleteDoc(doc(db, "studyAnswer", "saved")));
    });
    it.each(["other-user", "anonymous"])(
      "[FIRESTORE-RULES-STUDY-ANSWER-04] rejects %s reads and answer batches",
      async (actor) => {
        await createData("studyAnswer", "saved", answer());
        const db = testEnv
          .authenticatedContext(actor === "anonymous" ? "owner" : actor, {
            firebase: { sign_in_provider: actor === "anonymous" ? "anonymous" : "google.com", identities: {} },
          })
          .firestore();
        await assertFails(getDoc(doc(db, "studyAnswer", "saved")));
        const batch = writeBatch(db);
        batch.set(doc(db, "studyAnswer", "new"), answer());
        batch.set(doc(db, "cardStudyState", "5:ownerfirst"), {
          schemaVersion: 1,
          uid: "owner",
          cardId: "first",
          deckId: "deck",
          fsrs: validFsrs,
          createdAt: 2000,
          updatedAt: 2000,
        });
        batch.update(doc(db, "studySession", "session"), { currentIndex: 1 });
        await assertFails(batch.commit());
      }
    );
  });

  describe("authenticated context", () => {
    let db: firebase.default.firestore.Firestore;

    beforeEach(() => {
      db = testEnv
        .authenticatedContext("uid", { firebase: { sign_in_provider: "google.com", identities: {} } })
        .firestore();
    });

    describe("deck", () => {
      it.each([null, 1000])("[FIRESTORE-RULES-DECK-02] should read an owned deck (deletedAt=%s)", async (deletedAt) => {
        const id = uuid();
        await createData("deck", id, { uid: "uid", isPublic: false, deletedAt });
        await assertSucceeds(getDoc(doc(db, "deck", id)));
      });

      it("[FIRESTORE-RULES-DECK-03] should create a deck", async () => {
        const id = uuid();
        await assertSucceeds(setDoc(doc(db, "deck", id), { uid: "uid" }));
      });

      it("[FIRESTORE-RULES-DECK-04] should update a deck", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid" });
        await assertSucceeds(updateDoc(doc(db, "deck", id), { uid: "uid", name: "update" }));
      });

      it("[FIRESTORE-RULES-DECK-05] should delete a deck", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid" });
        await assertSucceeds(deleteDoc(doc(db, "deck", id)));
      });

      it("[FIRESTORE-RULES-DECK-20] rejects changing or removing the owner UID", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid" });
        const reference = doc(db, "deck", id);
        await assertFails(updateDoc(reference, { uid: "another-user" }));
        await assertFails(updateDoc(reference, { uid: null }));
        await assertFails(updateDoc(reference, { uid: deleteField() }));
        await assertFails(setDoc(reference, { name: "replacement" }));
      });

      it("[FIRESTORE-RULES-DECK-22] lists only the owner's decks including deleted decks", async () => {
        await createData("deck", "private", { uid: "uid", isPublic: false, deletedAt: null });
        await createData("deck", "public", { uid: "uid", isPublic: true, deletedAt: null });
        await createData("deck", "deleted", { uid: "uid", isPublic: true, deletedAt: 1000 });
        await createData("deck", "other-public", { uid: "another-user", isPublic: true, deletedAt: null });
        await createData("deck", "other-private", { uid: "another-user", isPublic: false, deletedAt: null });
        const snapshot = await assertSucceeds(
          getDocs(query(firestoreCollection(db, "deck"), where("uid", "==", "uid")))
        );
        expect(snapshot.docs.map((document) => document.id).sort()).toEqual(["deleted", "private", "public"]);
      });
    });

    describe("card", () => {
      it("[FIRESTORE-RULES-CARD-02] should read a card", async () => {
        const id = uuid();
        await createData("card", id, { uid: "uid" });
        await assertSucceeds(getDoc(doc(db, "card", id)));
      });

      it("[FIRESTORE-RULES-CARD-03] should create a card", async () => {
        const [deckId, id] = [uuid(), uuid()];
        await createData("deck", deckId, { uid: "uid" });
        await assertSucceeds(setDoc(doc(db, "card", id), { uid: "uid", deckId }));
      });

      it("[FIRESTORE-RULES-CARD-04] should update a card", async () => {
        const [deckId, id] = [uuid(), uuid()];
        await createData("deck", deckId, { uid: "uid" });
        await createData("card", id, { uid: "uid" });
        await assertSucceeds(updateDoc(doc(db, "card", id), { uid: "uid", deckId }));
      });

      it("[FIRESTORE-RULES-CARD-05] should delete a card", async () => {
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
      it.each([{}, { isPublic: false }])(
        "[FIRESTORE-RULES-DECK-06] should not read a deck (visibility=%j)",
        async (visibility) => {
          const id = uuid();
          await createData("deck", id, { uid: "uid", ...visibility });
          await assertFails(getDoc(doc(db, "deck", id)));
        }
      );

      it("[FIRESTORE-RULES-DECK-07] should read a public deck", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid", isPublic: true });
        await assertSucceeds(getDoc(doc(db, "deck", id)));
      });

      it("[FIRESTORE-RULES-DECK-08] should not create a deck", async () => {
        const id = uuid();
        await assertFails(setDoc(doc(db, "deck", id), { uid: "uid" }));
      });

      it.each([{}, { isPublic: false }, { isPublic: true }])(
        "[FIRESTORE-RULES-DECK-09] should not update a deck (visibility=%j)",
        async (visibility) => {
          const id = uuid();
          await createData("deck", id, { uid: "uid", deletedAt: null, ...visibility });
          await assertFails(updateDoc(doc(db, "deck", id), { uid: "uid", name: "update" }));
        }
      );

      it.each([{}, { isPublic: false }, { isPublic: true }])(
        "[FIRESTORE-RULES-DECK-10] should not delete a deck (visibility=%j)",
        async (visibility) => {
          const id = uuid();
          await createData("deck", id, { uid: "uid", deletedAt: null, ...visibility });
          await assertFails(deleteDoc(doc(db, "deck", id)));
        }
      );
    });

    it.each([false, true])(
      "[FIRESTORE-RULES-DECK-21] rejects taking ownership of another user's deck (isPublic=%s)",
      async (isPublic) => {
        const id = uuid();
        await createData("deck", id, { uid: "uid", isPublic, deletedAt: null });
        const reference = doc(db, "deck", id);
        await assertFails(updateDoc(reference, { uid: "invalid" }));
        await assertFails(setDoc(reference, { uid: "invalid", name: "replacement" }));
      }
    );

    describe("card", () => {
      it("[FIRESTORE-RULES-CARD-06] should not read a card", async () => {
        const id = uuid();
        await createData("card", id, { uid: "uid" });
        await assertFails(getDoc(doc(db, "card", id)));
      });

      it("[FIRESTORE-RULES-CARD-07] should read a public card", async () => {
        const [deckId, id] = [uuid(), uuid()];
        await createData("deck", deckId, { uid: "uid", isPublic: true });
        await createData("card", id, { uid: "uid", deckId });
        await assertSucceeds(getDoc(doc(db, "card", id)));
      });

      it("[FIRESTORE-RULES-CARD-08] should not create a card", async () => {
        const id = uuid();
        await assertFails(setDoc(doc(db, "card", id), { uid: "uid" }));
      });

      it("[FIRESTORE-RULES-CARD-09] should not update a card", async () => {
        const id = uuid();
        await createData("card", id, { uid: "uid" });
        await assertFails(updateDoc(doc(db, "card", id), { uid: "uid", name: "update" }));
      });

      it("[FIRESTORE-RULES-CARD-10] should not delete a card", async () => {
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

    it("[FIRESTORE-RULES-DECK-11] rejects creating a deck", async () => {
      const deckId = uuid();
      await createData("deck", deckId, { uid: "uid" });
      await assertFails(setDoc(doc(db, "deck", uuid()), { uid: "uid", deckId }));
    });

    it("[FIRESTORE-RULES-CARD-11] rejects creating a card", async () => {
      const deckId = uuid();
      await createData("deck", deckId, { uid: "uid" });
      await assertFails(setDoc(doc(db, "card", uuid()), { uid: "uid", deckId }));
    });

    it.each([{}, { isPublic: false }, { isPublic: true }])(
      "[FIRESTORE-RULES-DECK-12] rejects updating an existing deck (visibility=%j)",
      async (visibility) => {
        const id = uuid();
        await createData("deck", id, { uid: "uid", deletedAt: null, ...visibility });
        await assertFails(updateDoc(doc(db, "deck", id), { name: "guest update" }));
      }
    );

    it("[FIRESTORE-RULES-CARD-12] rejects updating an existing card", async () => {
      const [deckId, id] = [uuid(), uuid()];
      await createData("deck", deckId, { uid: "uid" });
      await createData("card", id, { uid: "uid", deckId });
      await assertFails(updateDoc(doc(db, "card", id), { name: "guest update" }));
    });

    it.each([{}, { isPublic: false }, { isPublic: true }])(
      "[FIRESTORE-RULES-DECK-13] rejects deleting an existing deck (visibility=%j)",
      async (visibility) => {
        const id = uuid();
        await createData("deck", id, { uid: "uid", deletedAt: null, ...visibility });
        await assertFails(deleteDoc(doc(db, "deck", id)));
      }
    );

    it("[FIRESTORE-RULES-CARD-13] rejects deleting an existing card", async () => {
      const id = uuid();
      await createData("card", id, { uid: "uid" });
      await assertFails(deleteDoc(doc(db, "card", id)));
    });

    it("[FIRESTORE-RULES-DECK-14] preserves public deck reads", async () => {
      const deckId = uuid();
      await createData("deck", deckId, { uid: "another-user", isPublic: true });
      await assertSucceeds(getDoc(doc(db, "deck", deckId)));
    });

    it.each([{}, { isPublic: false }])(
      "[FIRESTORE-RULES-DECK-24] rejects reading another user's private deck (visibility=%j)",
      async (visibility) => {
        const id = uuid();
        await createData("deck", id, { uid: "another-user", ...visibility });
        await assertFails(getDoc(doc(db, "deck", id)));
      }
    );

    it("[FIRESTORE-RULES-CARD-14] preserves public card reads", async () => {
      const deckId = uuid();
      const cardId = uuid();
      await createData("deck", deckId, { uid: "another-user", isPublic: true });
      await createData("card", cardId, { uid: "another-user", deckId });
      await assertSucceeds(getDoc(doc(db, "card", cardId)));
    });
  });

  describe("unauthenticated context", () => {
    let db: firebase.default.firestore.Firestore;

    beforeEach(() => {
      db = testEnv.unauthenticatedContext().firestore();
    });

    describe("deck", () => {
      it.each([{}, { isPublic: false }])(
        "[FIRESTORE-RULES-DECK-15] should not read a deck (visibility=%j)",
        async (visibility) => {
          const id = uuid();
          await createData("deck", id, { uid: "uid", ...visibility });
          await assertFails(getDoc(doc(db, "deck", id)));
        }
      );

      it("[FIRESTORE-RULES-DECK-16] should read a public deck", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid", isPublic: true });
        await assertSucceeds(getDoc(doc(db, "deck", id)));
      });

      it("[FIRESTORE-RULES-DECK-17] should not create a deck", async () => {
        const id = uuid();
        await assertFails(setDoc(doc(db, "deck", id), { uid: "uid" }));
      });

      it.each([{}, { isPublic: false }, { isPublic: true }])(
        "[FIRESTORE-RULES-DECK-18] should not update a deck (visibility=%j)",
        async (visibility) => {
          const id = uuid();
          await createData("deck", id, { uid: "uid", deletedAt: null, ...visibility });
          await assertFails(updateDoc(doc(db, "deck", id), { uid: "uid", name: "update" }));
        }
      );

      it.each([{}, { isPublic: false }, { isPublic: true }])(
        "[FIRESTORE-RULES-DECK-19] should not delete a deck (visibility=%j)",
        async (visibility) => {
          const id = uuid();
          await createData("deck", id, { uid: "uid", deletedAt: null, ...visibility });
          await assertFails(deleteDoc(doc(db, "deck", id)));
        }
      );
    });

    describe("card", () => {
      it("[FIRESTORE-RULES-CARD-15] should not read a card", async () => {
        const id = uuid();
        await createData("card", id, { uid: "uid" });
        await assertFails(getDoc(doc(db, "card", id)));
      });

      it("[FIRESTORE-RULES-CARD-16] should read a public card", async () => {
        const [deckId, id] = [uuid(), uuid()];
        await createData("deck", deckId, { uid: "uid", isPublic: true });
        await createData("card", id, { uid: "uid", deckId });
        await assertSucceeds(getDoc(doc(db, "card", id)));
      });

      it("[FIRESTORE-RULES-CARD-17] should not create a card", async () => {
        const id = uuid();
        await assertFails(setDoc(doc(db, "card", id), { uid: "uid" }));
      });

      it("[FIRESTORE-RULES-CARD-18] should not update a card", async () => {
        const id = uuid();
        await createData("card", id, { uid: "uid" });
        await assertFails(updateDoc(doc(db, "card", id), { uid: "uid", name: "update" }));
      });

      it("[FIRESTORE-RULES-CARD-19] should not delete a card", async () => {
        const id = uuid();
        await createData("card", id, { uid: "uid" });
        await assertFails(deleteDoc(doc(db, "card", id)));
      });
    });
  });

  it.each(["other-user", "anonymous", "unauthenticated"])(
    "[FIRESTORE-RULES-DECK-23] rejects unsafe deck queries from %s",
    async (actor) => {
      await createData("deck", "private", { uid: "uid", isPublic: false, deletedAt: null });
      await createData("deck", "public", { uid: "uid", isPublic: true, deletedAt: null });
      const db =
        actor === "unauthenticated"
          ? testEnv.unauthenticatedContext().firestore()
          : testEnv
              .authenticatedContext(actor, {
                firebase: { sign_in_provider: actor === "anonymous" ? "anonymous" : "google.com", identities: {} },
              })
              .firestore();
      await assertFails(getDocs(firestoreCollection(db, "deck")));
      await assertFails(getDocs(query(firestoreCollection(db, "deck"), where("uid", "==", "uid"))));
    }
  );

  describe("CardStudyState", () => {
    const state = {
      schemaVersion: 1,
      uid: "owner",
      cardId: "card",
      deckId: "deck",
      fsrs: null,
      createdAt: 1000,
      updatedAt: 1000,
    };
    const ownerDb = () =>
      testEnv
        .authenticatedContext("owner", { firebase: { sign_in_provider: "google.com", identities: {} } })
        .firestore();
    beforeEach(async () => {
      await createData("deck", "deck", { uid: "owner", isPublic: true });
      await createData("card", "card", { uid: "owner", deckId: "deck", deletedAt: null });
    });
    it("[FIRESTORE-RULES-CARD-STUDY-STATE-01] permits optional owner state and keeps its identity stable", async () => {
      const db = ownerDb();
      const reference = doc(db, "cardStudyState", "5:ownercard");
      await assertSucceeds(getDoc(doc(db, "card", "card")));
      await assertSucceeds(setDoc(reference, state));
      await assertSucceeds(getDoc(reference));
      await assertSucceeds(getDocs(query(firestoreCollection(db, "cardStudyState"), where("uid", "==", "owner"))));
      await assertSucceeds(updateDoc(reference, { fsrs: validFsrs, updatedAt: 2000 }));
      await assertFails(updateDoc(reference, { uid: "other" }));
      await assertFails(updateDoc(reference, { cardId: "other" }));
      await assertFails(updateDoc(reference, { createdAt: 2000 }));
      await assertSucceeds(deleteDoc(reference));
      await assertSucceeds(deleteDoc(reference));
    });
    it.each(["other", "anonymous", "unauthenticated"])(
      "[FIRESTORE-RULES-CARD-STUDY-STATE-02] keeps public Card state private from %s",
      async (actor) => {
        await createData("cardStudyState", "5:ownercard", state);
        const db =
          actor === "unauthenticated"
            ? testEnv.unauthenticatedContext().firestore()
            : testEnv
                .authenticatedContext(actor === "anonymous" ? "owner" : actor, {
                  firebase: { sign_in_provider: actor === "anonymous" ? "anonymous" : "google.com", identities: {} },
                })
                .firestore();
        await assertSucceeds(getDoc(doc(db, "card", "card")));
        const reference = doc(db, "cardStudyState", "5:ownercard");
        await assertFails(getDoc(reference));
        await assertFails(getDocs(query(firestoreCollection(db, "cardStudyState"), where("uid", "==", "owner"))));
        await assertFails(setDoc(reference, state));
        await assertFails(updateDoc(reference, { updatedAt: 2000 }));
        await assertFails(deleteDoc(reference));
        await assertFails(deleteDoc(doc(db, "cardStudyState", "5:ownermissing-card")));
      }
    );
    it("[FIRESTORE-RULES-CARD-STUDY-STATE-03] rejects invalid identity, metadata and unrelated Cards", async () => {
      const db = ownerDb();
      const reference = doc(db, "cardStudyState", "5:ownercard");
      await assertFails(setDoc(doc(db, "cardStudyState", "wrong-id"), state));
      for (const change of [
        { schemaVersion: 2 },
        { id: "duplicate" },
        { deckId: "other" },
        { fsrs: 1 },
        { createdAt: "1000" },
        { updatedAt: 1.5 },
      ])
        await assertFails(setDoc(reference, { ...state, ...change }));
      await assertSucceeds(setDoc(reference, { ...state, fsrs: {}, createdAt: -1, updatedAt: 253402300800000 }));
      await assertSucceeds(updateDoc(reference, { fsrs: { ...validFsrs, difficulty: 0, stability: Infinity } }));
      await assertSucceeds(deleteDoc(reference));
      await createData("card", "card", { uid: "other", deckId: "deck" });
      await assertFails(setDoc(reference, state));
      await createData("card", "card", { uid: "owner", deckId: "deck", deletedAt: 1000 });
      await assertFails(setDoc(reference, state));
    });
    it.each(["difficulty", "numberOfSeen", "firstSeenAt", "lastSeenAt", "nextSeeingAt", "interval", "studySchedule"])(
      "[FIRESTORE-RULES-CARD-20] rejects legacy Card field %s",
      async (field) => {
        const db = ownerDb();
        await assertFails(setDoc(doc(db, "card", "new"), { uid: "owner", deckId: "deck", [field]: 1 }));
        await assertFails(updateDoc(doc(db, "card", "card"), { [field]: 1 }));
      }
    );
    it("[FIRESTORE-RULES-CARD-STUDY-STATE-04] accepts delimiter and Unicode characters in deterministic IDs", async () => {
      const uid = "a:日😀";
      const cardId = "b:c😀";
      const db = testEnv
        .authenticatedContext(uid, { firebase: { sign_in_provider: "google.com", identities: {} } })
        .firestore();
      await createData("deck", "deck", { uid });
      await createData("card", cardId, { uid, deckId: "deck" });
      const reference = doc(db, "cardStudyState", `${uid.length}:${uid}${cardId}`);
      await assertSucceeds(setDoc(reference, { ...state, uid, cardId }));
      await assertSucceeds(deleteDoc(reference));
      await assertSucceeds(deleteDoc(reference));
    });
  });
});
