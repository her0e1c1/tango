import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { createCard, createDeck, createLocalCard, createLocalDeck } from "@/test/factories";
import { prepareDeckImport } from "./useDeckImportExecution";

describe("prepareDeckImport", () => {
  const row = {
    rowNumber: 1,
    card: { frontText: "front", backText: "back", tags: ["tag"], uniqueKey: "key-1" },
  };
  const rows = [row];

  it("prepares a Deck command, Card creation, and preview action together", () => {
    const preparedImport = prepareDeckImport(
      { name: "deck.csv", rows },
      { uid: "uid", decks: [], cards: [], generateCardId: vi.fn(() => "card") }
    );

    expect(preparedImport.destination).toEqual({ id: expect.any(String), storageMode: "remote" });
    expect(preparedImport.createDeckInput).toEqual({
      id: preparedImport.destination.id,
      name: "deck.csv",
      localMode: false,
    });
    expect(preparedImport.plan).toMatchObject({ created: 1, updated: 0, unchanged: 0 });
    expect(preparedImport.mutations).toEqual([
      { kind: "create", card: expect.objectContaining({ id: "card", uniqueKey: "key-1" }) },
    ]);
  });

  it("reuses an existing Deck without constructing a creation command", () => {
    const deck = createDeck({ id: "deck", name: "deck.csv", uid: "uid" });
    const existing = createCard({
      id: "existing",
      deckId: deck.id,
      uid: deck.uid,
      frontText: "before",
      uniqueKey: "key-1",
    });
    const preparedImport = prepareDeckImport(
      { name: deck.name, rows },
      { uid: deck.uid, decks: [deck], cards: [existing], generateCardId: vi.fn() }
    );

    expect(preparedImport.destination).toEqual({ id: deck.id, storageMode: "remote" });
    expect(preparedImport.createDeckInput).toBeUndefined();
    expect(preparedImport.plan).toMatchObject({ created: 0, updated: 1, unchanged: 0 });
    expect(preparedImport.mutations).toEqual([
      { kind: "edit", card: expect.objectContaining({ id: existing.id, frontText: "front" }) },
    ]);
  });

  it("skips a Card with identical editable content", () => {
    const deck = createDeck({ id: "deck", name: "deck.csv", uid: "uid" });
    const existing = createCard({ ...row.card, deckId: deck.id, uid: deck.uid });
    const preparedImport = prepareDeckImport(
      { name: deck.name, rows },
      { uid: deck.uid, decks: [deck], cards: [existing], generateCardId: vi.fn() }
    );

    expect(preparedImport.plan).toMatchObject({ created: 0, updated: 0, unchanged: 1 });
    expect(preparedImport.mutations).toEqual([]);
  });

  it("prepares local Deck and Card creation without an account owner", () => {
    const preparedImport = prepareDeckImport(
      { name: "local.csv", rows, storageMode: "local" },
      { uid: "", decks: [], cards: [], generateCardId: vi.fn(() => "local-card") }
    );

    expect(preparedImport.destination).toEqual({ id: expect.any(String), storageMode: "local" });
    expect(preparedImport.createDeckInput).toEqual({
      id: preparedImport.destination.id,
      name: "local.csv",
      localMode: true,
    });
    expect(preparedImport.mutations).toEqual([
      {
        kind: "create",
        card: {
          ...row.card,
          id: "local-card",
          deckId: preparedImport.destination.id,
        },
      },
    ]);
  });

  it("plans a local re-import from only the matching local Deck", () => {
    const remoteDeck = createDeck({ id: "remote", name: "shared.csv", uid: "uid" });
    const localDeck = createLocalDeck({ id: "local", name: "shared.csv" });
    const remoteCard = createCard({ ...row.card, id: "remote-card", deckId: remoteDeck.id, uid: remoteDeck.uid });
    const localCard = createLocalCard({
      ...row.card,
      id: "local-card",
      deckId: localDeck.id,
      frontText: "before",
    });
    const preparedImport = prepareDeckImport(
      { name: localDeck.name, rows, storageMode: "local" },
      {
        uid: "uid",
        decks: [remoteDeck, localDeck],
        cards: [remoteCard, localCard],
        generateCardId: vi.fn(),
      }
    );

    expect(preparedImport.destination).toEqual({ id: localDeck.id, storageMode: "local" });
    expect(preparedImport.createDeckInput).toBeUndefined();
    expect(preparedImport.plan).toMatchObject({ created: 0, updated: 1, unchanged: 0 });
    expect(preparedImport.mutations).toEqual([
      { kind: "edit", card: expect.objectContaining({ id: localCard.id, frontText: "front" }) },
    ]);
  });
});
