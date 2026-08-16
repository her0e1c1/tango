import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { createCard, createDeck, createLocalCard, createLocalDeck } from "@/test/factories";
import { prepareDeckImport } from "./deckImportExecution";

describe("prepareDeckImport", () => {
  const row = {
    rowNumber: 1,
    card: { frontText: "front", backText: "back", tags: ["tag"], uniqueKey: "key-1" },
  };
  const rows = [row];

  it("prepares a Card creation and its preview action together", () => {
    const attempt = prepareDeckImport(
      { name: "deck.csv", rows },
      { uid: "uid", decks: [], cards: [], generateCardId: vi.fn(() => "card") }
    );

    expect(attempt.plan).toMatchObject({ created: 1, updated: 0, unchanged: 0 });
    expect(attempt.mutations).toEqual([
      { kind: "create", card: expect.objectContaining({ id: "card", uniqueKey: "key-1" }) },
    ]);
  });

  it("creates a new Deck when an existing Deck has the same name", () => {
    const deck = createDeck({ id: "deck", name: "deck.csv", uid: "uid" });
    const existing = createCard({
      id: "existing",
      deckId: deck.id,
      uid: deck.uid,
      frontText: "before",
      uniqueKey: "key-1",
    });
    const attempt = prepareDeckImport(
      { name: deck.name, rows },
      { uid: deck.uid, decks: [deck], cards: [existing], generateCardId: vi.fn(() => "new-card") }
    );

    expect(attempt.deck.id).not.toBe(deck.id);
    expect(attempt.createDeck).toBe(true);
    expect(attempt.plan).toMatchObject({ created: 1, updated: 0, unchanged: 0 });
    expect(attempt.mutations).toEqual([
      { kind: "create", card: expect.objectContaining({ id: "new-card", frontText: "front" }) },
    ]);
  });

  it("does not inspect Cards from a same-name Deck", () => {
    const deck = createDeck({ id: "deck", name: "deck.csv", uid: "uid" });
    const existing = createCard({ ...row.card, deckId: deck.id, uid: deck.uid });
    const attempt = prepareDeckImport(
      { name: deck.name, rows },
      { uid: deck.uid, decks: [deck], cards: [existing], generateCardId: vi.fn(() => "new-card") }
    );

    expect(attempt.plan).toMatchObject({ created: 1, updated: 0, unchanged: 0 });
    expect(attempt.mutations).toEqual([
      { kind: "create", card: expect.objectContaining({ id: "new-card", uniqueKey: "key-1" }) },
    ]);
  });

  it("prepares local Deck and Card creation without an account owner", () => {
    const attempt = prepareDeckImport(
      { name: "local.csv", rows, storageMode: "local" },
      { uid: "", decks: [], cards: [], generateCardId: vi.fn(() => "local-card") }
    );

    expect(attempt.deck).toEqual({ id: expect.any(String), name: "local.csv", localMode: true });
    expect(attempt.mutations).toEqual([
      {
        kind: "create",
        card: {
          ...row.card,
          id: "local-card",
          deckId: attempt.deck.id,
        },
      },
    ]);
  });

  it("creates a new local Deck when local and remote Decks have the same name", () => {
    const remoteDeck = createDeck({ id: "remote", name: "shared.csv", uid: "uid" });
    const localDeck = createLocalDeck({ id: "local", name: "shared.csv" });
    const remoteCard = createCard({ ...row.card, id: "remote-card", deckId: remoteDeck.id, uid: remoteDeck.uid });
    const localCard = createLocalCard({
      ...row.card,
      id: "local-card",
      deckId: localDeck.id,
      frontText: "before",
    });
    const attempt = prepareDeckImport(
      { name: localDeck.name, rows, storageMode: "local" },
      {
        uid: "uid",
        decks: [remoteDeck, localDeck],
        cards: [remoteCard, localCard],
        generateCardId: vi.fn(() => "new-card"),
      }
    );

    expect(attempt.deck.id).not.toBe(localDeck.id);
    expect(attempt.createDeck).toBe(true);
    expect(attempt.plan).toMatchObject({ created: 1, updated: 0, unchanged: 0 });
    expect(attempt.mutations).toEqual([
      { kind: "create", card: expect.objectContaining({ id: "new-card", frontText: "front" }) },
    ]);
  });
});
