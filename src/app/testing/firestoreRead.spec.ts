/**
 * @file Verifies the "Firestore full reads" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "reads only active Deck
 * documents for the UID", "reads only active Card documents for the UID", "returns empty
 * collections when the UID has no documents".
 */

import "@/shared/firebase/test/initializeTestFirestore";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc, type Firestore } from "firebase/firestore";
import * as UUID from "uuid";

import * as cardAdapter from "@/entities/card/api/firestoreCard";
import * as deckAdapter from "@/entities/deck/api/firestoreDeck";
import { buildCardCreateDto } from "@/entities/card/api/cardDto";
import { buildDeckCreateDto } from "@/entities/deck/api/deckDto";
import { createCard } from "@/entities/card";
import { createDeck } from "@/entities/deck";

const uuid = UUID.v4;

describe("Firestore full reads", () => {
  let testEnv: RulesTestEnvironment;
  let db: Firestore;

  const seed = async (collectionName: "deck" | "card", id: string, data: object) => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), collectionName, id), data);
    });
  };

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "test-read",
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
    const active = createDeck({ id: uuid(), uid: "uid", name: "Active remote" });
    const deleted = createDeck({ id: uuid(), uid: "uid", name: "Deleted remote", deletedAt: 100 });
    const foreign = createDeck({ id: uuid(), uid: "other", name: "Foreign remote" });
    await seed("deck", active.id, buildDeckCreateDto(active, active.createdAt));
    await seed("deck", deleted.id, buildDeckCreateDto(deleted, deleted.createdAt));
    await seed("deck", foreign.id, buildDeckCreateDto(foreign, foreign.createdAt));

    await expect(deckAdapter.readAll("uid", db)).resolves.toEqual([
      expect.objectContaining({ id: active.id, name: "Active remote" }),
    ]);
  });

  it("reads only active Card documents for the UID", async () => {
    const deck = createDeck({ id: uuid(), uid: "uid" });
    const active = createCard({ id: uuid(), deckId: deck.id, uid: "uid", frontText: "Active remote" });
    const deleted = createCard({ id: uuid(), deckId: deck.id, uid: "uid", frontText: "Deleted remote" });
    const foreign = createCard({ id: uuid(), deckId: "foreign-deck", uid: "other", frontText: "Foreign remote" });
    await seed("deck", deck.id, buildDeckCreateDto(deck, deck.createdAt));
    await seed("card", active.id, buildCardCreateDto(active, active.createdAt));
    await seed("card", deleted.id, { ...buildCardCreateDto(deleted, deleted.createdAt), deletedAt: 100 });
    await seed("card", foreign.id, buildCardCreateDto(foreign, foreign.createdAt));

    await expect(cardAdapter.readAll("uid", db)).resolves.toEqual([
      expect.objectContaining({ id: active.id, frontText: "Active remote" }),
    ]);
  });

  it("returns empty collections when the UID has no documents", async () => {
    await expect(deckAdapter.readAll("uid", db)).resolves.toEqual([]);
    await expect(cardAdapter.readAll("uid", db)).resolves.toEqual([]);
  });

  it("rejects an invalid Deck document with its field path", async () => {
    const deck = createDeck({ id: uuid(), uid: "uid" });
    await seed("deck", deck.id, { ...buildDeckCreateDto(deck, deck.createdAt), selectedTags: [42] });

    await expect(deckAdapter.readAll("uid", db)).rejects.toMatchObject({
      name: "FirestoreDocumentValidationError",
      collectionName: "deck",
      documentId: deck.id,
      message: expect.stringContaining("selectedTags.0"),
    });
  });

  it("rejects an invalid Card nextSeeingAt with its field path", async () => {
    const card = createCard({ id: uuid(), uid: "uid" });
    await seed("card", card.id, { ...buildCardCreateDto(card, card.createdAt), nextSeeingAt: null });

    await expect(cardAdapter.readAll("uid", db)).rejects.toMatchObject({
      name: "FirestoreDocumentValidationError",
      collectionName: "card",
      documentId: card.id,
      message: expect.stringContaining("nextSeeingAt"),
    });
  });
});
