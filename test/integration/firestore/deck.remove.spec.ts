import { readFileSync } from "node:fs";

import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, type Firestore } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { v4 as uuid } from "uuid";

import { buildCardCreateDto } from "@/entities/card/api/firestoreDocument";
import { buildDeckCreateDto } from "@/entities/deck/api/firestoreDocument";
import { removeDeckWithCards } from "@/features/deck-removal/api/removeDeck";
import { createCard, createDeck } from "@/test/factories";

describe("Deck removal with the Firestore emulator", () => {
  let testEnv: RulesTestEnvironment;
  let db: Firestore;

  const seed = async (collectionName: "deck" | "card", id: string, data: object) => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), collectionName, id), data);
    });
  };

  const existsWithoutRules = async (collectionName: "deck" | "card", id: string) => {
    let exists = false;
    await testEnv.withSecurityRulesDisabled(async (context) => {
      exists = (await getDoc(doc(context.firestore(), collectionName, id))).exists();
    });
    return exists;
  };

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "test-deck-removal",
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

  it("deletes matching Cards before deleting their Deck", async () => {
    const deck = createDeck({ id: uuid(), uid: "uid" });
    const cards = [
      createCard({ id: uuid(), deckId: deck.id, uid: deck.uid }),
      createCard({ id: uuid(), deckId: deck.id, uid: deck.uid }),
    ];
    await seed("deck", deck.id, buildDeckCreateDto(deck, deck.createdAt));
    await Promise.all(cards.map((card) => seed("card", card.id, buildCardCreateDto(card, card.createdAt))));

    await removeDeckWithCards(deck.id, deck.uid, db);

    await expect(existsWithoutRules("deck", deck.id)).resolves.toBe(false);
    await Promise.all(
      cards.map(async (card) => {
        await expect(existsWithoutRules("card", card.id)).resolves.toBe(false);
      })
    );
  });

  it("commits Card cleanup before a rejected Deck deletion", async () => {
    const deck = createDeck({ id: uuid(), uid: "other-user" });
    const card = createCard({ id: uuid(), deckId: deck.id, uid: "uid" });
    await seed("deck", deck.id, buildDeckCreateDto(deck, deck.createdAt));
    await seed("card", card.id, buildCardCreateDto(card, card.createdAt));

    await expect(removeDeckWithCards(deck.id, card.uid, db)).rejects.toMatchObject({ code: "permission-denied" });

    await expect(existsWithoutRules("card", card.id)).resolves.toBe(false);
    await expect(existsWithoutRules("deck", deck.id)).resolves.toBe(true);
  });
});
