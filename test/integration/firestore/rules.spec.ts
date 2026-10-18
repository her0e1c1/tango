/**
 * @file Verifies the Firestore security-rule contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "should read a deck",
 * "should create a deck", "should update a deck".
 */

import { it, expect, describe, beforeEach, beforeAll, afterAll } from "vitest";
import * as fs from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  setDoc as saveDocument,
  type DocumentReference,
  type DocumentData,
  writeBatch,
  doc,
  getDoc,
  updateDoc as updateDocument,
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

const setDoc = (reference: DocumentReference, data: DocumentData) =>
  saveDocument(reference, { ...data, updatedAt: serverTimestamp() });
const updateDoc = (reference: DocumentReference, data: DocumentData) =>
  updateDocument(reference, { ...data, updatedAt: serverTimestamp() });

describe("Firestore ownership and guest write restrictions", () => {
  let testEnv: RulesTestEnvironment;

  const createData = async (path: string, id: string, data: object) => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, path, id), data);
    });
  };

  beforeAll(async () => {
    // Given: Establish the shared setup used by the following cases.
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
    // Given: Establish the shared setup used by the following cases.
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
      // Given: Prepare `db`, `reference` and any shared test state below.
      const db = ownerDb();
      const reference = doc(db, "studySession", uuid());
      // When: Evaluate `setDoc` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
      await assertSucceeds(setDoc(reference, sessionData()));
      // When: Observe the prepared result through the following checks.
      // Then: Verify the expected result in the assertions below.
      await assertSucceeds(getDoc(reference));
      // When: Observe the prepared result through the following checks.
      // Then: Verify the expected result in the assertions below.
      await assertSucceeds(getDocs(query(firestoreCollection(db, "studySession"), where("uid", "==", "uid"))));
      // When: Evaluate `updateDoc` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
      await assertSucceeds(updateDoc(reference, { currentIndex: 1, updatedAt: serverTimestamp() }));
      // When: Evaluate `updateDoc` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
      await assertSucceeds(
        updateDoc(reference, { endReason: "completed", endedAt: serverTimestamp(), updatedAt: serverTimestamp() })
      );
    });

    it.each(["other-user", "anonymous", "unauthenticated"])(
      "[FIRESTORE-RULES-STUDY-SESSION-02] denies %s access even when the Deck is public",
      async (actor) => {
        // Given: Prepare `id`, `db`, `reference` and any shared test state below.
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
        // When: Observe the prepared result through the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertFails(getDoc(reference));
        // When: Observe the prepared result through the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertFails(getDocs(query(firestoreCollection(db, "studySession"), where("uid", "==", "uid"))));
        // When: Evaluate `setDoc` as part of the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertFails(setDoc(doc(db, "studySession", uuid()), sessionData()));
        // When: Evaluate `updateDoc` as part of the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertFails(updateDoc(reference, { currentIndex: 1, updatedAt: serverTimestamp() }));
        // When: Evaluate `deleteDoc` as part of the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertFails(deleteDoc(reference));
      }
    );

    it("[FIRESTORE-RULES-STUDY-SESSION-03] rejects ownership changes and deletion", async () => {
      // Given: Prepare `reference` and any shared test state below.
      const reference = doc(ownerDb(), "studySession", uuid());
      await setDoc(reference, sessionData());
      // When: Evaluate `updateDoc` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
      await assertFails(updateDoc(reference, { uid: "another-user", updatedAt: serverTimestamp() }));
      // When: Evaluate `deleteDoc` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
      await assertFails(deleteDoc(reference));
    });
  });

  describe("Deleted public content", () => {
    it.each(["other-user", "anonymous", "unauthenticated"])(
      "[FIRESTORE-RULES-DECK-01] rejects %s from reading a deleted public Deck",
      async (actor) => {
        // Given: Prepare `db` and any shared test state below.
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
        // When: Observe the prepared result through the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertFails(getDoc(doc(db, "deck", "deleted")));
        // When: Observe the prepared result through the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertSucceeds(getDoc(doc(db, "deck", "active")));
      }
    );

    it.each(["other-user", "anonymous", "unauthenticated"])(
      "[FIRESTORE-RULES-CARD-01] rejects %s from reading deleted public Card content",
      async (actor) => {
        // Given: Prepare `db` and any shared test state below.
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
        // When: Observe the prepared result through the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertFails(getDoc(doc(db, "card", "child")));
        // When: Observe the prepared result through the following checks.
        // Then: Verify the expected result in the assertions below.
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
      updatedAt: serverTimestamp(),
    });
    const ownerDb = () =>
      testEnv
        .authenticatedContext("owner", { firebase: { sign_in_provider: "google.com", identities: {} } })
        .firestore();
    beforeEach(async () => {
      // Given: Establish the shared setup used by the following cases.
      await createData("deck", "deck", { uid: "owner", isPublic: false });
      for (const id of ["first", "last"])
        await createData("card", id, { uid: "owner", deckId: "deck", fsrs: null, createdAt: 0, deletedAt: null });
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
      // Given: Prepare `db` and any shared test state below.
      const db = ownerDb();
      for (const [index, cardId] of ["first", "last"].entries()) {
        // Given: Prepare `batch` and any shared test state below.
        const batch = writeBatch(db);
        batch.set(doc(db, "studyAnswer", `session-${String(index)}`), answer(cardId));
        batch.update(doc(db, "card", cardId), { fsrs: validFsrs, updatedAt: serverTimestamp() });
        batch.update(doc(db, "studySession", "session"), {
          currentIndex: 1,
          ...(index === 1 ? { endReason: "completed", endedAt: Timestamp.fromMillis(2000) } : {}),
          updatedAt: serverTimestamp(),
        });
        // When: Evaluate `batch.commit` as part of the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertSucceeds(batch.commit());
        // When: Read the saved answer using the owner's credentials.
        // Then: Verify the expected result in the assertions below.
        await assertSucceeds(getDoc(doc(db, "studyAnswer", `session-${String(index)}`)));
      }
    });
    it("[FIRESTORE-RULES-STUDY-ANSWER-02] leaves answer sequencing to the application", async () => {
      // Given: Prepare `db` and any shared test state below.
      const db = ownerDb();
      // When: Evaluate `setDoc` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
      await assertSucceeds(setDoc(doc(db, "studyAnswer", "standalone"), answer("last")));
      // When: Exercise `updateDoc` with the prepared inputs.
      await updateDoc(doc(db, "studySession", "session"), { endReason: "completed" });
      // When: Evaluate `setDoc` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
      await assertSucceeds(setDoc(doc(db, "studyAnswer", "another-id"), answer("last")));
    });
    it("[FIRESTORE-RULES-STUDY-ANSWER-03] forbids rewriting or deleting answer history", async () => {
      // Given: Prepare `db` and any shared test state below.
      const db = ownerDb();
      await createData("studyAnswer", "saved", answer());
      // When: Evaluate `updateDoc` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
      await assertFails(updateDoc(doc(db, "studyAnswer", "saved"), { answer: { type: "rating", rating: "again" } }));
      // When: Evaluate `deleteDoc` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
      await assertFails(deleteDoc(doc(db, "studyAnswer", "saved")));
    });
    it.each(["other-user", "anonymous"])(
      "[FIRESTORE-RULES-STUDY-ANSWER-04] rejects %s reads and answer batches",
      async (actor) => {
        // Given: Prepare `db` and any shared test state below.
        await createData("studyAnswer", "saved", answer());
        const db = testEnv
          .authenticatedContext(actor === "anonymous" ? "owner" : actor, {
            firebase: { sign_in_provider: actor === "anonymous" ? "anonymous" : "google.com", identities: {} },
          })
          .firestore();
        // When: Observe the prepared result through the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertFails(getDoc(doc(db, "studyAnswer", "saved")));
        // When: Exercise `writeBatch` with the prepared inputs.
        const batch = writeBatch(db);
        batch.set(doc(db, "studyAnswer", "new"), answer());
        batch.update(doc(db, "card", "first"), { fsrs: validFsrs, updatedAt: serverTimestamp() });
        batch.update(doc(db, "studySession", "session"), { currentIndex: 1 });
        // When: Evaluate `batch.commit` as part of the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertFails(batch.commit());
      }
    );
  });

  describe("authenticated context", () => {
    let db: firebase.default.firestore.Firestore;

    beforeEach(() => {
      // Given: Establish the shared setup used by the following cases.
      db = testEnv
        .authenticatedContext("uid", { firebase: { sign_in_provider: "google.com", identities: {} } })
        .firestore();
    });

    describe("deck", () => {
      it.each([null, 1000])("[FIRESTORE-RULES-DECK-02] should read an owned deck (deletedAt=%s)", async (deletedAt) => {
        // Given: Prepare `id` and any shared test state below.
        const id = uuid();
        await createData("deck", id, { uid: "uid", isPublic: false, deletedAt });
        // When: Observe the prepared result through the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertSucceeds(getDoc(doc(db, "deck", id)));
      });

      it("[FIRESTORE-RULES-DECK-03] should create a deck", async () => {
        // Given: Prepare `id` and any shared test state below.
        const id = uuid();
        // When: Evaluate `setDoc` as part of the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertSucceeds(setDoc(doc(db, "deck", id), { uid: "uid" }));
      });

      it("[FIRESTORE-RULES-DECK-04] should update a deck", async () => {
        // Given: Prepare `id` and any shared test state below.
        const id = uuid();
        await createData("deck", id, { uid: "uid" });
        // When: Evaluate `updateDoc` as part of the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertSucceeds(updateDoc(doc(db, "deck", id), { uid: "uid", name: "update" }));
      });

      it("[FIRESTORE-RULES-DECK-05] rejects owner physical deletion", async () => {
        // Given: Prepare `id` and any shared test state below.
        const id = uuid();
        await createData("deck", id, { uid: "uid" });
        // When: Evaluate `deleteDoc` as part of the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertFails(deleteDoc(doc(db, "deck", id)));
      });

      it("[FIRESTORE-RULES-DECK-25] allows tombstoning and edits that preserve deletion", async () => {
        // Given: Prepare `reference` and any shared test state below.
        const reference = doc(db, "deck", uuid());
        await createData("deck", reference.id, { uid: "uid", deletedAt: null });
        // When: Evaluate `updateDoc` as part of the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertSucceeds(updateDoc(reference, { deletedAt: 1000 }));
        // When: Evaluate `updateDoc` as part of the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertSucceeds(updateDoc(reference, { name: "Updated" }));
        expect((await getDoc(reference)).data()).toMatchObject({ deletedAt: 1000, name: "Updated" });
      });

      it.each(["clear", "remove", "replace"])(
        "[FIRESTORE-RULES-DECK-26] rejects restoring a tombstoned Deck through %s",
        async (operation) => {
          // Given: Prepare `reference`, `data`, `before` and any shared test state below.
          const reference = doc(db, "deck", uuid());
          const data = { uid: "uid", name: "Deleted" };
          await createData("deck", reference.id, { ...data, deletedAt: 1000 });
          const before = (await getDoc(reference)).data();
          // When: Evaluate `setDoc` as part of the following checks.
          // Then: Verify the expected result in the assertions below.
          await assertFails(
            operation === "replace"
              ? setDoc(reference, data)
              : updateDoc(reference, { deletedAt: operation === "clear" ? null : deleteField() })
          );
          expect((await getDoc(reference)).data()).toEqual(before);
        }
      );

      it("[FIRESTORE-RULES-DECK-20] rejects changing or removing the owner UID", async () => {
        // Given: Prepare `id`, `reference` and any shared test state below.
        const id = uuid();
        await createData("deck", id, { uid: "uid" });
        const reference = doc(db, "deck", id);
        // When: Evaluate `updateDoc` as part of the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertFails(updateDoc(reference, { uid: "another-user" }));
        // When: Evaluate `updateDoc` as part of the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertFails(updateDoc(reference, { uid: null }));
        // When: Evaluate `updateDoc` as part of the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertFails(updateDoc(reference, { uid: deleteField() }));
        // When: Evaluate `setDoc` as part of the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertFails(setDoc(reference, { name: "replacement" }));
      });

      it("[FIRESTORE-RULES-DECK-22] lists only the owner's decks including deleted decks", async () => {
        // Given: Prepare `snapshot` and any shared test state below.
        await createData("deck", "private", { uid: "uid", isPublic: false, deletedAt: null });
        await createData("deck", "public", { uid: "uid", isPublic: true, deletedAt: null });
        await createData("deck", "deleted", { uid: "uid", isPublic: true, deletedAt: 1000 });
        await createData("deck", "other-public", { uid: "another-user", isPublic: true, deletedAt: null });
        await createData("deck", "other-private", { uid: "another-user", isPublic: false, deletedAt: null });
        // When: List Decks using the owner's UID-constrained query.
        const snapshot = await assertSucceeds(
          getDocs(query(firestoreCollection(db, "deck"), where("uid", "==", "uid")))
        );
        // Then: Verify the expected result in the assertions below.
        expect(snapshot.docs.map((document) => document.id).sort()).toEqual(["deleted", "private", "public"]);
      });
    });

    describe("card", () => {
      it("[FIRESTORE-RULES-CARD-02] should read a card", async () => {
        // Given: Prepare `id` and any shared test state below.
        const id = uuid();
        await createData("card", id, { uid: "uid" });
        // When: Observe the prepared result through the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertSucceeds(getDoc(doc(db, "card", id)));
      });

      it("[FIRESTORE-RULES-CARD-03] should create a card", async () => {
        // Given: Use this case's inputs and any shared test setup.
        const [deckId, id] = [uuid(), uuid()];
        await createData("deck", deckId, { uid: "uid" });
        // When: Evaluate `setDoc` as part of the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertSucceeds(
          setDoc(doc(db, "card", id), { uid: "uid", deckId, fsrs: null, createdAt: 0, deletedAt: null })
        );
      });

      it("[FIRESTORE-RULES-CARD-04] should update a card", async () => {
        // Given: Use this case's inputs and any shared test setup.
        const [deckId, id] = [uuid(), uuid()];
        await createData("deck", deckId, { uid: "uid" });
        await createData("card", id, { uid: "uid", deckId, fsrs: null, createdAt: 0, deletedAt: null });
        // When: Evaluate `updateDoc` as part of the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertSucceeds(updateDoc(doc(db, "card", id), { frontText: "Updated" }));
      });

      it("[FIRESTORE-RULES-CARD-05] rejects owner physical deletion", async () => {
        // Given: Prepare `id` and any shared test state below.
        const id = uuid();
        await createData("card", id, { uid: "uid" });
        // When: Evaluate `deleteDoc` as part of the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertFails(deleteDoc(doc(db, "card", id)));
      });

      it("[FIRESTORE-RULES-CARD-25] allows tombstoning and edits that preserve deletion", async () => {
        // Given: Prepare `deckId`, `reference` and any shared test state below.
        const deckId = uuid();
        const reference = doc(db, "card", uuid());
        await createData("deck", deckId, { uid: "uid" });
        await createData("card", reference.id, { uid: "uid", deckId, fsrs: null, createdAt: 0, deletedAt: null });
        // When: Evaluate `updateDoc` as part of the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertSucceeds(updateDoc(reference, { deletedAt: 1000 }));
        // When: Evaluate `updateDoc` as part of the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertSucceeds(updateDoc(reference, { frontText: "Updated" }));
        expect((await getDoc(reference)).data()).toMatchObject({ deletedAt: 1000, frontText: "Updated" });
      });

      it.each(["clear", "remove", "replace"])(
        "[FIRESTORE-RULES-CARD-26] rejects restoring a tombstoned Card through %s",
        async (operation) => {
          // Given: Prepare `deckId`, `reference`, `data` and any shared test state below.
          const deckId = uuid();
          const reference = doc(db, "card", uuid());
          const data = { uid: "uid", deckId, fsrs: null, createdAt: 0, frontText: "Deleted" };
          await createData("deck", deckId, { uid: "uid" });
          await createData("card", reference.id, { ...data, deletedAt: 1000 });
          const before = (await getDoc(reference)).data();
          // When: Evaluate `setDoc` as part of the following checks.
          // Then: Verify the expected result in the assertions below.
          await assertFails(
            operation === "replace"
              ? setDoc(reference, data)
              : updateDoc(reference, { deletedAt: operation === "clear" ? null : deleteField() })
          );
          expect((await getDoc(reference)).data()).toEqual(before);
        }
      );
    });
  });

  describe("invalid authenticated context", () => {
    let db: firebase.default.firestore.Firestore;

    beforeEach(() => {
      // Given: Establish the shared setup used by the following cases.
      db = testEnv
        .authenticatedContext("invalid", { firebase: { sign_in_provider: "google.com", identities: {} } })
        .firestore();
    });

    describe("deck", () => {
      it.each([{}, { isPublic: false }])(
        "[FIRESTORE-RULES-DECK-06] should not read a deck (visibility=%j)",
        async (visibility) => {
          // Given: Prepare `id` and any shared test state below.
          const id = uuid();
          await createData("deck", id, { uid: "uid", ...visibility });
          // When: Observe the prepared result through the following checks.
          // Then: Verify the expected result in the assertions below.
          await assertFails(getDoc(doc(db, "deck", id)));
        }
      );

      it("[FIRESTORE-RULES-DECK-07] should read a public deck", async () => {
        // Given: Prepare `id` and any shared test state below.
        const id = uuid();
        await createData("deck", id, { uid: "uid", isPublic: true });
        // When: Observe the prepared result through the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertSucceeds(getDoc(doc(db, "deck", id)));
      });

      it("[FIRESTORE-RULES-DECK-08] should not create a deck", async () => {
        // Given: Prepare `id` and any shared test state below.
        const id = uuid();
        // When: Evaluate `setDoc` as part of the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertFails(setDoc(doc(db, "deck", id), { uid: "uid" }));
      });

      it.each([{}, { isPublic: false }, { isPublic: true }])(
        "[FIRESTORE-RULES-DECK-09] should not update a deck (visibility=%j)",
        async (visibility) => {
          // Given: Prepare `id` and any shared test state below.
          const id = uuid();
          await createData("deck", id, { uid: "uid", deletedAt: null, ...visibility });
          // When: Evaluate `updateDoc` as part of the following checks.
          // Then: Verify the expected result in the assertions below.
          await assertFails(updateDoc(doc(db, "deck", id), { uid: "uid", name: "update" }));
        }
      );

      it.each([{}, { isPublic: false }, { isPublic: true }])(
        "[FIRESTORE-RULES-DECK-10] should not delete a deck (visibility=%j)",
        async (visibility) => {
          // Given: Prepare `id` and any shared test state below.
          const id = uuid();
          await createData("deck", id, { uid: "uid", deletedAt: null, ...visibility });
          // When: Evaluate `deleteDoc` as part of the following checks.
          // Then: Verify the expected result in the assertions below.
          await assertFails(deleteDoc(doc(db, "deck", id)));
        }
      );
    });

    it.each([false, true])(
      "[FIRESTORE-RULES-DECK-21] rejects taking ownership of another user's deck (isPublic=%s)",
      async (isPublic) => {
        // Given: Prepare `id`, `reference` and any shared test state below.
        const id = uuid();
        await createData("deck", id, { uid: "uid", isPublic, deletedAt: null });
        const reference = doc(db, "deck", id);
        // When: Evaluate `updateDoc` as part of the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertFails(updateDoc(reference, { uid: "invalid" }));
        // When: Evaluate `setDoc` as part of the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertFails(setDoc(reference, { uid: "invalid", name: "replacement" }));
      }
    );

    describe("card", () => {
      it("[FIRESTORE-RULES-CARD-06] should not read a card", async () => {
        // Given: Prepare `id` and any shared test state below.
        const id = uuid();
        await createData("card", id, { uid: "uid" });
        // When: Observe the prepared result through the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertFails(getDoc(doc(db, "card", id)));
      });

      it("[FIRESTORE-RULES-CARD-07] should read a public card", async () => {
        // Given: Use this case's inputs and any shared test setup.
        const [deckId, id] = [uuid(), uuid()];
        await createData("deck", deckId, { uid: "uid", isPublic: true });
        await createData("card", id, { uid: "uid", deckId });
        // When: Observe the prepared result through the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertSucceeds(getDoc(doc(db, "card", id)));
      });

      it("[FIRESTORE-RULES-CARD-08] should not create a card", async () => {
        // Given: Prepare `id` and any shared test state below.
        const id = uuid();
        // When: Evaluate `setDoc` as part of the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertFails(setDoc(doc(db, "card", id), { uid: "uid" }));
      });

      it("[FIRESTORE-RULES-CARD-09] should not update a card", async () => {
        // Given: Prepare `id` and any shared test state below.
        const id = uuid();
        await createData("card", id, { uid: "uid" });
        // When: Evaluate `updateDoc` as part of the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertFails(updateDoc(doc(db, "card", id), { uid: "uid", name: "update" }));
      });

      it("[FIRESTORE-RULES-CARD-10] should not delete a card", async () => {
        // Given: Prepare `id` and any shared test state below.
        const id = uuid();
        await createData("card", id, { uid: "uid" });
        // When: Evaluate `deleteDoc` as part of the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertFails(deleteDoc(doc(db, "card", id)));
      });
    });
  });

  describe("anonymous context with a matching owner UID", () => {
    let db: firebase.default.firestore.Firestore;

    beforeEach(() => {
      // Given: Establish the shared setup used by the following cases.
      db = testEnv
        .authenticatedContext("uid", { firebase: { sign_in_provider: "anonymous", identities: {} } })
        .firestore();
    });

    it("[FIRESTORE-RULES-DECK-11] rejects creating a deck", async () => {
      // Given: Prepare `deckId` and any shared test state below.
      const deckId = uuid();
      await createData("deck", deckId, { uid: "uid" });
      // When: Evaluate `setDoc` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
      await assertFails(setDoc(doc(db, "deck", uuid()), { uid: "uid", deckId }));
    });

    it("[FIRESTORE-RULES-CARD-11] rejects creating a card", async () => {
      // Given: Prepare `deckId` and any shared test state below.
      const deckId = uuid();
      await createData("deck", deckId, { uid: "uid" });
      // When: Evaluate `setDoc` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
      await assertFails(setDoc(doc(db, "card", uuid()), { uid: "uid", deckId }));
    });

    it.each([{}, { isPublic: false }, { isPublic: true }])(
      "[FIRESTORE-RULES-DECK-12] rejects updating an existing deck (visibility=%j)",
      async (visibility) => {
        // Given: Prepare `id` and any shared test state below.
        const id = uuid();
        await createData("deck", id, { uid: "uid", deletedAt: null, ...visibility });
        // When: Evaluate `updateDoc` as part of the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertFails(updateDoc(doc(db, "deck", id), { name: "guest update" }));
      }
    );

    it("[FIRESTORE-RULES-CARD-12] rejects updating an existing card", async () => {
      // Given: Use this case's inputs and any shared test setup.
      const [deckId, id] = [uuid(), uuid()];
      await createData("deck", deckId, { uid: "uid" });
      await createData("card", id, { uid: "uid", deckId });
      // When: Evaluate `updateDoc` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
      await assertFails(updateDoc(doc(db, "card", id), { name: "guest update" }));
    });

    it.each([{}, { isPublic: false }, { isPublic: true }])(
      "[FIRESTORE-RULES-DECK-13] rejects deleting an existing deck (visibility=%j)",
      async (visibility) => {
        // Given: Prepare `id` and any shared test state below.
        const id = uuid();
        await createData("deck", id, { uid: "uid", deletedAt: null, ...visibility });
        // When: Evaluate `deleteDoc` as part of the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertFails(deleteDoc(doc(db, "deck", id)));
      }
    );

    it("[FIRESTORE-RULES-CARD-13] rejects deleting an existing card", async () => {
      // Given: Prepare `id` and any shared test state below.
      const id = uuid();
      await createData("card", id, { uid: "uid" });
      // When: Evaluate `deleteDoc` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
      await assertFails(deleteDoc(doc(db, "card", id)));
    });

    it("[FIRESTORE-RULES-DECK-14] preserves public deck reads", async () => {
      // Given: Prepare `deckId` and any shared test state below.
      const deckId = uuid();
      await createData("deck", deckId, { uid: "another-user", isPublic: true });
      // When: Observe the prepared result through the following checks.
      // Then: Verify the expected result in the assertions below.
      await assertSucceeds(getDoc(doc(db, "deck", deckId)));
    });

    it.each([{}, { isPublic: false }])(
      "[FIRESTORE-RULES-DECK-24] rejects reading another user's private deck (visibility=%j)",
      async (visibility) => {
        // Given: Prepare `id` and any shared test state below.
        const id = uuid();
        await createData("deck", id, { uid: "another-user", ...visibility });
        // When: Observe the prepared result through the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertFails(getDoc(doc(db, "deck", id)));
      }
    );

    it("[FIRESTORE-RULES-CARD-14] preserves public card reads", async () => {
      // Given: Prepare `deckId`, `cardId` and any shared test state below.
      const deckId = uuid();
      const cardId = uuid();
      await createData("deck", deckId, { uid: "another-user", isPublic: true });
      await createData("card", cardId, { uid: "another-user", deckId });
      // When: Observe the prepared result through the following checks.
      // Then: Verify the expected result in the assertions below.
      await assertSucceeds(getDoc(doc(db, "card", cardId)));
    });
  });

  describe("unauthenticated context", () => {
    let db: firebase.default.firestore.Firestore;

    beforeEach(() => {
      // Given: Establish the shared setup used by the following cases.
      db = testEnv.unauthenticatedContext().firestore();
    });

    describe("deck", () => {
      it.each([{}, { isPublic: false }])(
        "[FIRESTORE-RULES-DECK-15] should not read a deck (visibility=%j)",
        async (visibility) => {
          // Given: Prepare `id` and any shared test state below.
          const id = uuid();
          await createData("deck", id, { uid: "uid", ...visibility });
          // When: Observe the prepared result through the following checks.
          // Then: Verify the expected result in the assertions below.
          await assertFails(getDoc(doc(db, "deck", id)));
        }
      );

      it("[FIRESTORE-RULES-DECK-16] should read a public deck", async () => {
        // Given: Prepare `id` and any shared test state below.
        const id = uuid();
        await createData("deck", id, { uid: "uid", isPublic: true });
        // When: Observe the prepared result through the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertSucceeds(getDoc(doc(db, "deck", id)));
      });

      it("[FIRESTORE-RULES-DECK-17] should not create a deck", async () => {
        // Given: Prepare `id` and any shared test state below.
        const id = uuid();
        // When: Evaluate `setDoc` as part of the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertFails(setDoc(doc(db, "deck", id), { uid: "uid" }));
      });

      it.each([{}, { isPublic: false }, { isPublic: true }])(
        "[FIRESTORE-RULES-DECK-18] should not update a deck (visibility=%j)",
        async (visibility) => {
          // Given: Prepare `id` and any shared test state below.
          const id = uuid();
          await createData("deck", id, { uid: "uid", deletedAt: null, ...visibility });
          // When: Evaluate `updateDoc` as part of the following checks.
          // Then: Verify the expected result in the assertions below.
          await assertFails(updateDoc(doc(db, "deck", id), { uid: "uid", name: "update" }));
        }
      );

      it.each([{}, { isPublic: false }, { isPublic: true }])(
        "[FIRESTORE-RULES-DECK-19] should not delete a deck (visibility=%j)",
        async (visibility) => {
          // Given: Prepare `id` and any shared test state below.
          const id = uuid();
          await createData("deck", id, { uid: "uid", deletedAt: null, ...visibility });
          // When: Evaluate `deleteDoc` as part of the following checks.
          // Then: Verify the expected result in the assertions below.
          await assertFails(deleteDoc(doc(db, "deck", id)));
        }
      );
    });

    describe("card", () => {
      it("[FIRESTORE-RULES-CARD-15] should not read a card", async () => {
        // Given: Prepare `id` and any shared test state below.
        const id = uuid();
        await createData("card", id, { uid: "uid" });
        // When: Observe the prepared result through the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertFails(getDoc(doc(db, "card", id)));
      });

      it("[FIRESTORE-RULES-CARD-16] should read a public card", async () => {
        // Given: Use this case's inputs and any shared test setup.
        const [deckId, id] = [uuid(), uuid()];
        await createData("deck", deckId, { uid: "uid", isPublic: true });
        await createData("card", id, { uid: "uid", deckId });
        // When: Observe the prepared result through the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertSucceeds(getDoc(doc(db, "card", id)));
      });

      it("[FIRESTORE-RULES-CARD-17] should not create a card", async () => {
        // Given: Prepare `id` and any shared test state below.
        const id = uuid();
        // When: Evaluate `setDoc` as part of the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertFails(setDoc(doc(db, "card", id), { uid: "uid" }));
      });

      it("[FIRESTORE-RULES-CARD-18] should not update a card", async () => {
        // Given: Prepare `id` and any shared test state below.
        const id = uuid();
        await createData("card", id, { uid: "uid" });
        // When: Evaluate `updateDoc` as part of the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertFails(updateDoc(doc(db, "card", id), { uid: "uid", name: "update" }));
      });

      it("[FIRESTORE-RULES-CARD-19] should not delete a card", async () => {
        // Given: Prepare `id` and any shared test state below.
        const id = uuid();
        await createData("card", id, { uid: "uid" });
        // When: Evaluate `deleteDoc` as part of the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertFails(deleteDoc(doc(db, "card", id)));
      });
    });
  });

  it.each(["other-user", "anonymous", "unauthenticated"])(
    "[FIRESTORE-RULES-DECK-23] rejects unsafe deck queries from %s",
    async (actor) => {
      // Given: Prepare `db` and any shared test state below.
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
      // When: Observe the prepared result through the following checks.
      // Then: Verify the expected result in the assertions below.
      await assertFails(getDocs(firestoreCollection(db, "deck")));
      // When: Observe the prepared result through the following checks.
      // Then: Verify the expected result in the assertions below.
      await assertFails(getDocs(query(firestoreCollection(db, "deck"), where("uid", "==", "uid"))));
    }
  );

  describe("Card FSRS", () => {
    const card = { uid: "owner", deckId: "deck", fsrs: null, createdAt: 1000, updatedAt: 1000, deletedAt: null };
    const ownerDb = () =>
      testEnv
        .authenticatedContext("owner", { firebase: { sign_in_provider: "google.com", identities: {} } })
        .firestore();
    beforeEach(async () => {
      // Given: Establish the shared setup used by the following cases.
      await createData("deck", "deck", { uid: "owner", isPublic: true });
      await createData("card", "card", card);
    });
    it.each(["difficulty", "numberOfSeen", "firstSeenAt", "lastSeenAt", "nextSeeingAt", "interval", "studySchedule"])(
      "[FIRESTORE-RULES-CARD-20] rejects legacy Card field %s",
      async (field) => {
        // Given: Prepare `db` and any shared test state below.
        const db = ownerDb();
        // When: Evaluate `setDoc` as part of the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertFails(setDoc(doc(db, "card", "new"), { ...card, [field]: 1 }));
        // When: Evaluate `updateDoc` as part of the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertFails(updateDoc(doc(db, "card", "card"), { [field]: 1 }));
      }
    );
    it("[FIRESTORE-RULES-CARD-21] permits owner FSRS updates and preserves Card identity", async () => {
      // Given: Prepare `db`, `reference` and any shared test state below.
      const db = ownerDb();
      const reference = doc(db, "card", "card");
      // When: Observe the prepared result through the following checks.
      // Then: Verify the expected result in the assertions below.
      await assertSucceeds(getDoc(reference));
      // When: Observe the prepared result through the following checks.
      // Then: Verify the expected result in the assertions below.
      await assertSucceeds(getDocs(query(firestoreCollection(db, "card"), where("uid", "==", "owner"))));
      // When: Evaluate `updateDoc` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
      await assertSucceeds(updateDoc(reference, { fsrs: validFsrs, updatedAt: serverTimestamp() }));
      // When: Evaluate `updateDoc` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
      await assertFails(updateDoc(reference, { uid: "other" }));
      // When: Evaluate `updateDoc` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
      await assertFails(updateDoc(reference, { deckId: "other" }));
      // When: Evaluate `updateDoc` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
      await assertFails(updateDoc(reference, { createdAt: 2000 }));
      // When: Evaluate `deleteDoc` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
      await assertFails(deleteDoc(reference));
    });
    it.each(["other", "anonymous", "unauthenticated"])(
      "[FIRESTORE-RULES-CARD-22] exposes public Card FSRS but denies writes from %s",
      async (actor) => {
        // Given: Prepare `db`, `reference` and any shared test state below.
        await createData("card", "card", { ...card, fsrs: validFsrs });
        const db =
          actor === "unauthenticated"
            ? testEnv.unauthenticatedContext().firestore()
            : testEnv
                .authenticatedContext(actor === "anonymous" ? "owner" : actor, {
                  firebase: { sign_in_provider: actor === "anonymous" ? "anonymous" : "google.com", identities: {} },
                })
                .firestore();
        const reference = doc(db, "card", "card");
        // When: Observe the prepared result through the following checks.
        // Then: Verify the expected result in the assertions below.
        expect((await assertSucceeds(getDoc(reference))).data()?.fsrs).toEqual(validFsrs);
        // When: Evaluate `setDoc` as part of the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertFails(setDoc(reference, card));
        // When: Evaluate `updateDoc` as part of the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertFails(updateDoc(reference, { fsrs: null, updatedAt: serverTimestamp() }));
        // When: Evaluate `deleteDoc` as part of the following checks.
        // Then: Verify the expected result in the assertions below.
        await assertFails(deleteDoc(reference));
      }
    );
    it("[FIRESTORE-RULES-CARD-23] rejects invalid FSRS shape and foreign or deleted Cards", async () => {
      // Given: Prepare `reference` and any shared test state below.
      const reference = doc(ownerDb(), "card", "card");
      // When: Evaluate `updateDoc` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
      await assertFails(updateDoc(reference, { fsrs: 1 }));
      // Detailed numeric validation belongs to the application parser.
      // When: Evaluate `updateDoc` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
      await assertSucceeds(updateDoc(reference, { fsrs: {} }));
      // When: Evaluate `updateDoc` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
      await assertSucceeds(updateDoc(reference, { fsrs: { ...validFsrs, difficulty: 0, stability: Infinity } }));
      await createData("card", "card", { ...card, uid: "other" });
      // When: Evaluate `updateDoc` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
      await assertFails(updateDoc(reference, { fsrs: validFsrs }));
      await createData("card", "card", { ...card, deletedAt: 1000 });
      // When: Evaluate `updateDoc` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
      await assertFails(updateDoc(reference, { fsrs: validFsrs }));
      await createData("card", "card", card);
      await createData("deck", "deck", { uid: "other" });
      // When: Evaluate `updateDoc` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
      await assertFails(updateDoc(reference, { fsrs: validFsrs }));
    });
    it("[FIRESTORE-RULES-CARD-24] cannot recreate a deleted Card through a rating update", async () => {
      // Given: Prepare `reference` and any shared test state below.
      const reference = doc(ownerDb(), "card", "card");
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await deleteDoc(doc(context.firestore(), "card", "card"));
      });
      // When: Evaluate `updateDoc` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
      await assertFails(updateDoc(reference, { fsrs: validFsrs, updatedAt: serverTimestamp() }));
    });
  });
});
