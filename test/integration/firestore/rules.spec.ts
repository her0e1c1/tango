/** Verifies the Firestore security-rule contract for Google-linked accounts. */

import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import * as fs from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
  type TokenOptions,
} from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import * as Uuid from "uuid";

const uuid = Uuid.v4;
const googleAuth = (signInProvider: NonNullable<TokenOptions["firebase"]>["sign_in_provider"] = "google.com") =>
  ({
    firebase: {
      identities: { "google.com": ["google-subject"] },
      sign_in_provider: signInProvider,
    },
  }) satisfies TokenOptions;
const anonymousAuth = {
  firebase: { identities: {}, sign_in_provider: "anonymous" },
} satisfies TokenOptions;
const googleProviderWithoutIdentity = {
  firebase: { identities: {}, sign_in_provider: "google.com" },
} satisfies TokenOptions;

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

  describe("Google-linked owner", () => {
    let db: firebase.default.firestore.Firestore;

    beforeEach(() => {
      db = testEnv.authenticatedContext("uid", googleAuth()).firestore();
    });

    describe("deck", () => {
      it("reads an owned Deck", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid", isPublic: false });
        await assertSucceeds(getDoc(doc(db, "deck", id)));
      });

      it("creates an owned Deck", async () => {
        await assertSucceeds(setDoc(doc(db, "deck", uuid()), { uid: "uid" }));
      });

      it("updates an owned Deck", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid" });
        await assertSucceeds(updateDoc(doc(db, "deck", id), { uid: "uid", name: "update" }));
      });

      it("deletes an owned Deck", async () => {
        const id = uuid();
        await createData("deck", id, { uid: "uid" });
        await assertSucceeds(deleteDoc(doc(db, "deck", id)));
      });
    });

    describe("card", () => {
      it("reads an owned Card", async () => {
        const id = uuid();
        await createData("card", id, { uid: "uid" });
        await assertSucceeds(getDoc(doc(db, "card", id)));
      });

      it("creates an owned Card in an owned Deck", async () => {
        const [deckId, id] = [uuid(), uuid()];
        await createData("deck", deckId, { uid: "uid" });
        await assertSucceeds(setDoc(doc(db, "card", id), { uid: "uid", deckId }));
      });

      it("updates an owned Card in an owned Deck", async () => {
        const [deckId, id] = [uuid(), uuid()];
        await createData("deck", deckId, { uid: "uid" });
        await createData("card", id, { uid: "uid", deckId });
        await assertSucceeds(updateDoc(doc(db, "card", id), { uid: "uid", deckId, name: "update" }));
      });

      it("deletes an owned Card", async () => {
        const id = uuid();
        await createData("card", id, { uid: "uid" });
        await assertSucceeds(deleteDoc(doc(db, "card", id)));
      });
    });
  });

  describe("Google-linked non-owner", () => {
    let db: firebase.default.firestore.Firestore;

    beforeEach(() => {
      db = testEnv.authenticatedContext("other", googleAuth()).firestore();
    });

    it("reads a public Deck and its Cards", async () => {
      const [deckId, cardId] = [uuid(), uuid()];
      await createData("deck", deckId, { uid: "uid", isPublic: true });
      await createData("card", cardId, { uid: "uid", deckId });

      await assertSucceeds(getDoc(doc(db, "deck", deckId)));
      await assertSucceeds(getDoc(doc(db, "card", cardId)));
    });

    it("cannot read private data or mutate another account's data", async () => {
      const [deckId, cardId] = [uuid(), uuid()];
      await createData("deck", deckId, { uid: "uid", isPublic: false });
      await createData("card", cardId, { uid: "uid", deckId });

      await assertFails(getDoc(doc(db, "deck", deckId)));
      await assertFails(getDoc(doc(db, "card", cardId)));
      await assertFails(setDoc(doc(db, "deck", uuid()), { uid: "uid" }));
      await assertFails(updateDoc(doc(db, "deck", deckId), { uid: "uid", name: "update" }));
      await assertFails(deleteDoc(doc(db, "deck", deckId)));
      await assertFails(setDoc(doc(db, "card", uuid()), { uid: "uid", deckId }));
      await assertFails(updateDoc(doc(db, "card", cardId), { uid: "uid", deckId, name: "update" }));
      await assertFails(deleteDoc(doc(db, "card", cardId)));
    });
  });

  describe("anonymous user with the owner's UID", () => {
    let db: firebase.default.firestore.Firestore;

    beforeEach(() => {
      db = testEnv.authenticatedContext("uid", anonymousAuth).firestore();
    });

    it("cannot read or mutate Decks", async () => {
      const [privateId, publicId] = [uuid(), uuid()];
      await createData("deck", privateId, { uid: "uid", isPublic: false });
      await createData("deck", publicId, { uid: "uid", isPublic: true });

      await assertFails(getDoc(doc(db, "deck", privateId)));
      await assertFails(getDoc(doc(db, "deck", publicId)));
      await assertFails(setDoc(doc(db, "deck", uuid()), { uid: "uid" }));
      await assertFails(updateDoc(doc(db, "deck", privateId), { uid: "uid", name: "update" }));
      await assertFails(deleteDoc(doc(db, "deck", privateId)));
    });

    it("cannot read or mutate Cards", async () => {
      const [deckId, cardId] = [uuid(), uuid()];
      await createData("deck", deckId, { uid: "uid", isPublic: true });
      await createData("card", cardId, { uid: "uid", deckId });

      await assertFails(getDoc(doc(db, "card", cardId)));
      await assertFails(setDoc(doc(db, "card", uuid()), { uid: "uid", deckId }));
      await assertFails(updateDoc(doc(db, "card", cardId), { uid: "uid", deckId, name: "update" }));
      await assertFails(deleteDoc(doc(db, "card", cardId)));
    });
  });

  describe("unauthenticated user", () => {
    let db: firebase.default.firestore.Firestore;

    beforeEach(() => {
      db = testEnv.unauthenticatedContext().firestore();
    });

    it("cannot read public Decks or Cards", async () => {
      const [deckId, cardId] = [uuid(), uuid()];
      await createData("deck", deckId, { uid: "uid", isPublic: true });
      await createData("card", cardId, { uid: "uid", deckId });

      await assertFails(getDoc(doc(db, "deck", deckId)));
      await assertFails(getDoc(doc(db, "card", cardId)));
    });

    it("cannot mutate Decks or Cards", async () => {
      const [deckId, cardId] = [uuid(), uuid()];
      await createData("deck", deckId, { uid: "uid" });
      await createData("card", cardId, { uid: "uid", deckId });

      await assertFails(setDoc(doc(db, "deck", uuid()), { uid: "uid" }));
      await assertFails(updateDoc(doc(db, "deck", deckId), { uid: "uid", name: "update" }));
      await assertFails(deleteDoc(doc(db, "deck", deckId)));
      await assertFails(setDoc(doc(db, "card", uuid()), { uid: "uid", deckId }));
      await assertFails(updateDoc(doc(db, "card", cardId), { uid: "uid", deckId, name: "update" }));
      await assertFails(deleteDoc(doc(db, "card", cardId)));
    });
  });

  it("allows a linked Google identity when the current sign-in provider is different", async () => {
    const db = testEnv.authenticatedContext("uid", googleAuth("password")).firestore();
    const id = uuid();

    await assertSucceeds(setDoc(doc(db, "deck", id), { uid: "uid" }));
    await assertSucceeds(getDoc(doc(db, "deck", id)));
  });

  it("denies a Google sign-in provider without a linked Google identity", async () => {
    const db = testEnv.authenticatedContext("uid", googleProviderWithoutIdentity).firestore();
    const [privateId, publicId] = [uuid(), uuid()];
    await createData("deck", privateId, { uid: "uid", isPublic: false });
    await createData("deck", publicId, { uid: "uid", isPublic: true });

    await assertFails(getDoc(doc(db, "deck", privateId)));
    await assertFails(getDoc(doc(db, "deck", publicId)));
    await assertFails(setDoc(doc(db, "deck", uuid()), { uid: "uid" }));
  });
});
