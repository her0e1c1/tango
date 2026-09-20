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

describe("PERSIST-01 PERSIST-04 Firestore ownership and guest write restrictions", () => {
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

  describe("StudySession [SWIPE-06] [SWIPE-08] [SWIPE-09] [SWIPE-10]", () => {
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

    it("allows the owner to create, resume and complete a private session", async () => {
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
      "denies %s access even when the Deck is public",
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

    it("rejects ownership changes and deletion", async () => {
      const reference = doc(ownerDb(), "studySession", uuid());
      await setDoc(reference, sessionData());
      await assertFails(updateDoc(reference, { uid: "another-user", updatedAt: serverTimestamp() }));
      await assertFails(deleteDoc(reference));
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
  });

  describe("invalid authenticated context", () => {
    let db: firebase.default.firestore.Firestore;

    beforeEach(() => {
      db = testEnv
        .authenticatedContext("invalid", { firebase: { sign_in_provider: "google.com", identities: {} } })
        .firestore();
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

  describe("anonymous context with a matching owner UID", () => {
    let db: firebase.default.firestore.Firestore;

    beforeEach(() => {
      db = testEnv
        .authenticatedContext("uid", { firebase: { sign_in_provider: "anonymous", identities: {} } })
        .firestore();
    });

    it.each(["deck", "card"])("rejects creating a %s", async (collection) => {
      const deckId = uuid();
      await createData("deck", deckId, { uid: "uid" });
      await assertFails(setDoc(doc(db, collection, uuid()), { uid: "uid", deckId }));
    });

    it.each(["deck", "card"])("rejects updating an existing %s", async (collection) => {
      const [deckId, id] = [uuid(), uuid()];
      await createData("deck", deckId, { uid: "uid" });
      await createData(collection, id, { uid: "uid", deckId });
      await assertFails(updateDoc(doc(db, collection, id), { name: "guest update" }));
    });

    it.each(["deck", "card"])("rejects deleting an existing %s", async (collection) => {
      const id = uuid();
      await createData(collection, id, { uid: "uid" });
      await assertFails(deleteDoc(doc(db, collection, id)));
    });

    it.each(["deck", "card"])("preserves public %s reads", async (collection) => {
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
