import { it, describe, beforeEach } from "vitest";
import * as fs from "fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { setDoc, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";

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
        host: process.env.VITE_DB_HOST,
        port: parseInt(process.env.VITE_DB_PORT),
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
        await createData("deck", "deckId", { uid: "uid", isPublic: false });
        await assertSucceeds(getDoc(doc(db, "deck", "deckId")));
      });

      it("should create a deck", async () => {
        await assertSucceeds(setDoc(doc(db, "deck", "deckId"), { uid: "uid" }));
      });

      it("should update a deck", async () => {
        await createData("deck", "deckId", { uid: "uid" });
        await assertSucceeds(updateDoc(doc(db, "deck", "deckId"), { uid: "uid", name: "update" }));
      });

      it("should delete a deck", async () => {
        await createData("deck", "deckId", { uid: "uid" });
        await assertSucceeds(deleteDoc(doc(db, "deck", "deckId")));
      });
    });

    describe("card", () => {
      it("should read a card", async () => {
        await createData("card", "cardId", { uid: "uid" });
        await assertSucceeds(getDoc(doc(db, "card", "cardId")));
      });

      it("should create a card", async () => {
        await assertSucceeds(setDoc(doc(db, "card", "cardId"), { uid: "uid" }));
      });

      it("should update a card", async () => {
        await createData("deck", "deckId", { uid: "uid" });
        await createData("card", "cardId", { uid: "uid" }); // TODO: add deckId when created
        await assertSucceeds(updateDoc(doc(db, "card", "cardId"), { uid: "uid", deckId: "deckId" }));
      });

      it("should delete a card", async () => {
        await createData("card", "cardId", { uid: "uid" });
        await assertSucceeds(deleteDoc(doc(db, "card", "cardId")));
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
        await createData("deck", "deckId", { uid: "uid" });
        await assertFails(getDoc(doc(db, "deck", "deckId")));
      });

      it("should read a publick deck", async () => {
        await createData("deck", "deckId", { uid: "uid", isPublic: true });
        await assertSucceeds(getDoc(doc(db, "deck", "deckId")));
      });

      it("should not create a deck", async () => {
        await assertFails(setDoc(doc(db, "deck", "deckId"), { uid: "uid" }));
      });

      it("should not update a deck", async () => {
        await createData("deck", "deckId", { uid: "uid" });
        await assertFails(updateDoc(doc(db, "deck", "deckId"), { uid: "uid", name: "update" }));
      });

      it("should not delete a deck", async () => {
        await createData("deck", "deckId", { uid: "uid" });
        await assertFails(deleteDoc(doc(db, "deck", "deckId")));
      });
    });

    describe("card", () => {
      it("should not read a card", async () => {
        await createData("card", "cardId", { uid: "uid" });
        await assertFails(getDoc(doc(db, "card", "cardId")));
      });

      it("should read a public card", async () => {
        await createData("deck", "deckId", { uid: "uid", isPublic: true });
        await createData("card", "cardId", { uid: "uid", deckId: "deckId" });
        await assertSucceeds(getDoc(doc(db, "card", "cardId")));
      });

      it("should not create a card", async () => {
        await assertFails(setDoc(doc(db, "card", "cardId"), { uid: "uid" }));
      });

      it("should not update a card", async () => {
        await createData("card", "cardId", { uid: "uid" });
        await assertFails(updateDoc(doc(db, "card", "cardId"), { uid: "uid", name: "update" }));
      });

      it("should not delete a card", async () => {
        await createData("card", "cardId", { uid: "uid" });
        await assertFails(deleteDoc(doc(db, "card", "cardId")));
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
        await createData("deck", "deckId", { uid: "uid" });
        await assertFails(getDoc(doc(db, "deck", "deckId")));
      });

      it("should read a publick deck", async () => {
        await createData("deck", "deckId", { uid: "uid", isPublic: true });
        await assertSucceeds(getDoc(doc(db, "deck", "deckId")));
      });

      it("should not create a deck", async () => {
        await assertFails(setDoc(doc(db, "deck", "deckId"), { uid: "uid" }));
      });

      it("should not update a deck", async () => {
        await createData("deck", "deckId", { uid: "uid" });
        await assertFails(updateDoc(doc(db, "deck", "deckId"), { uid: "uid", name: "update" }));
      });

      it("should not delete a deck", async () => {
        await createData("deck", "deckId", { uid: "uid" });
        await assertFails(deleteDoc(doc(db, "deck", "deckId")));
      });
    });

    describe("card", () => {
      it("should not read a card", async () => {
        await createData("card", "cardId", { uid: "uid" });
        await assertFails(getDoc(doc(db, "card", "cardId")));
      });

      it("should read a public card", async () => {
        await createData("deck", "deckId", { uid: "uid", isPublic: true });
        await createData("card", "cardId", { uid: "uid", deckId: "deckId" });
        await assertSucceeds(getDoc(doc(db, "card", "cardId")));
      });

      it("should not create a card", async () => {
        await assertFails(setDoc(doc(db, "card", "cardId"), { uid: "uid" }));
      });

      it("should not update a card", async () => {
        await createData("card", "cardId", { uid: "uid" });
        await assertFails(updateDoc(doc(db, "card", "cardId"), { uid: "uid", name: "update" }));
      });

      it("should not delete a card", async () => {
        await createData("card", "cardId", { uid: "uid" });
        await assertFails(deleteDoc(doc(db, "card", "cardId")));
      });
    });
  });
});
