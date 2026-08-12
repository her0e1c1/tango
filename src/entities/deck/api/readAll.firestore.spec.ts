import { readFileSync } from "node:fs";

import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc, type Firestore } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import * as UUID from "uuid";

import { createDeck } from "@/test/factories";
import { readAll } from "./firestore";
import { buildDeckCreateDto } from "./firestoreDocument";

describe("Deck Firestore full reads", () => {
  let testEnv: RulesTestEnvironment;
  let db: Firestore;

  const seed = async (id: string, data: object) => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "deck", id), data);
    });
  };

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "test-deck-read",
      firestore: {
        rules: readFileSync("./firestore.rules", "utf8"),
        host: import.meta.env.VITE_DB_HOST,
        port: parseInt(import.meta.env.VITE_DB_PORT, 10),
      },
    });
    db = testEnv.authenticatedContext("uid").firestore() as unknown as Firestore;
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it("reads only active Deck documents for the UID", async () => {
    const active = createDeck({ id: UUID.v4(), uid: "uid", name: "Active remote" });
    const deleted = createDeck({ id: UUID.v4(), uid: "uid", name: "Deleted remote", deletedAt: 100 });
    const foreign = createDeck({ id: UUID.v4(), uid: "other", name: "Foreign remote" });
    await seed(active.id, buildDeckCreateDto(active, active.createdAt));
    await seed(deleted.id, buildDeckCreateDto(deleted, deleted.createdAt));
    await seed(foreign.id, buildDeckCreateDto(foreign, foreign.createdAt));

    await expect(readAll("uid", db)).resolves.toEqual([
      expect.objectContaining({ id: active.id, name: "Active remote" }),
    ]);
  });

  it("returns an empty collection when the UID has no documents", async () => {
    await expect(readAll("uid", db)).resolves.toEqual([]);
  });

  it("rejects an invalid document with its field path", async () => {
    const deck = createDeck({ id: UUID.v4(), uid: "uid" });
    await seed(deck.id, { ...buildDeckCreateDto(deck, deck.createdAt), selectedTags: [42] });

    await expect(readAll("uid", db)).rejects.toMatchObject({
      name: "FirestoreDocumentValidationError",
      collectionName: "deck",
      documentId: deck.id,
      message: expect.stringContaining("selectedTags.0"),
    });
  });
});
