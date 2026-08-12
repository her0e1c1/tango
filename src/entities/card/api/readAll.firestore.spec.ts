import { readFileSync } from "node:fs";

import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc, type Firestore } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import * as UUID from "uuid";

import { createCard } from "@/test/factories";
import { readAll } from "./firestore";
import { buildCardCreateDto } from "./firestoreDocument";

describe("Card Firestore full reads", () => {
  let testEnv: RulesTestEnvironment;
  let db: Firestore;

  const seed = async (id: string, data: object) => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "card", id), data);
    });
  };

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "test-card-read",
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

  it("reads only active Card documents for the UID", async () => {
    const active = createCard({ id: UUID.v4(), uid: "uid", frontText: "Active remote" });
    const deleted = createCard({ id: UUID.v4(), uid: "uid", frontText: "Deleted remote" });
    const foreign = createCard({ id: UUID.v4(), uid: "other", frontText: "Foreign remote" });
    await seed(active.id, buildCardCreateDto(active, active.createdAt));
    await seed(deleted.id, { ...buildCardCreateDto(deleted, deleted.createdAt), deletedAt: 100 });
    await seed(foreign.id, buildCardCreateDto(foreign, foreign.createdAt));

    await expect(readAll("uid", db)).resolves.toEqual([
      expect.objectContaining({ id: active.id, frontText: "Active remote" }),
    ]);
  });

  it("returns an empty collection when the UID has no documents", async () => {
    await expect(readAll("uid", db)).resolves.toEqual([]);
  });

  it("rejects an invalid nextSeeingAt with its field path", async () => {
    const card = createCard({ id: UUID.v4(), uid: "uid" });
    await seed(card.id, { ...buildCardCreateDto(card, card.createdAt), nextSeeingAt: null });

    await expect(readAll("uid", db)).rejects.toMatchObject({
      name: "FirestoreDocumentValidationError",
      collectionName: "card",
      documentId: card.id,
      message: expect.stringContaining("nextSeeingAt"),
    });
  });
});
