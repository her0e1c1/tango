import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { createCard, createDeck } from "@/test/factories";
import { executePreparedDeckImport, prepareDeckImport, prepareSampleDeckImport } from "./useDeckImportExecution";

describe("prepareDeckImport", () => {
  const row = {
    rowNumber: 1,
    card: { frontText: "front", backText: "back", tags: ["tag"], uniqueKey: "key-1" },
  };
  const rows = [row];

  it("prepares a Card creation and its preview action together", () => {
    const preparedImport = prepareDeckImport(
      { destination: { type: "new", name: "deck.csv" }, rows },
      { uid: "uid", decks: [], cards: [], generateCardId: vi.fn(() => "card") }
    );

    expect(preparedImport.plan).toMatchObject({ created: 1, updated: 0, unchanged: 0 });
    expect(preparedImport.mutations).toEqual([
      { kind: "create", card: expect.objectContaining({ id: "card", uniqueKey: "key-1" }) },
    ]);
  });

  it("prepares local Deck and Card creation without an account owner", () => {
    const preparedImport = prepareDeckImport(
      { destination: { type: "new", name: "local.csv" }, rows, storageMode: "local" },
      { uid: "", decks: [], cards: [], generateCardId: vi.fn(() => "local-card") }
    );

    expect(preparedImport.destination).toEqual({ id: expect.any(String), name: "local.csv", localMode: true });
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

  it("updates only the explicitly selected existing Deck", () => {
    const selected = createDeck({ id: "selected", name: "Same name", uid: "uid" });
    const sameName = createDeck({ id: "other", name: selected.name, uid: "uid" });
    const existing = createCard({
      id: "existing",
      deckId: selected.id,
      uid: "uid",
      uniqueKey: "key-1",
      backText: "before",
    });
    const preparedImport = prepareDeckImport(
      { destination: { type: "existing", deckId: selected.id }, rows },
      { uid: "uid", decks: [sameName, selected], cards: [existing], generateCardId: vi.fn() }
    );

    expect(preparedImport.destination.id).toBe(selected.id);
    expect(preparedImport.needsDeckCreation).toBe(false);
    expect(preparedImport.plan).toMatchObject({ created: 0, updated: 1, unchanged: 0 });
    expect(preparedImport.mutations).toEqual([
      { kind: "edit", card: expect.objectContaining({ id: existing.id, backText: "back" }) },
    ]);
  });

  it("rejects an existing destination from another storage mode", () => {
    const remoteDeck = createDeck({ id: "remote", uid: "uid" });

    expect(() =>
      prepareDeckImport(
        { destination: { type: "existing", deckId: remoteDeck.id }, rows, storageMode: "local" },
        { uid: "uid", decks: [remoteDeck], cards: [], generateCardId: vi.fn() }
      )
    ).toThrow("no longer uses the chosen storage mode");
  });

  it("keeps stable destination reuse inside the sample import path", () => {
    const deck = createDeck({ id: "sample", name: "Sample Deck", uid: "uid" });
    const existing = createCard({
      id: "existing",
      deckId: deck.id,
      uid: deck.uid,
      frontText: "before",
      uniqueKey: "key-1",
    });
    const preparedImport = prepareSampleDeckImport(
      { id: deck.id, name: deck.name, rows },
      {
        uid: deck.uid,
        decks: [deck],
        cards: [existing],
        generateCardId: vi.fn(),
      }
    );

    expect(preparedImport.destination.id).toBe(deck.id);
    expect(preparedImport.needsDeckCreation).toBe(false);
    expect(preparedImport.plan).toMatchObject({ created: 0, updated: 1, unchanged: 0 });
    expect(preparedImport.mutations).toEqual([
      { kind: "edit", card: expect.objectContaining({ id: existing.id, frontText: "front" }) },
    ]);
  });
});

describe("executePreparedDeckImport", () => {
  it("rejects a selected Deck deleted after preview without writing Cards", async () => {
    const deck = createDeck({ id: "selected", uid: "uid" });
    const preparedImport = prepareDeckImport(
      {
        destination: { type: "existing", deckId: deck.id },
        rows: [
          {
            rowNumber: 1,
            card: { frontText: "front", backText: "back", tags: [], uniqueKey: "key" },
          },
        ],
      },
      { uid: "uid", decks: [deck], cards: [], generateCardId: vi.fn(() => "card") }
    );
    const mutateCards = vi.fn();

    await expect(
      executePreparedDeckImport(preparedImport, {
        uid: "uid",
        createDeck: vi.fn(),
        mutateCards,
        loadDeck: vi.fn(async () => undefined),
      })
    ).rejects.toThrow("selected Deck is no longer available");
    expect(mutateCards).not.toHaveBeenCalled();
  });

  it("rejects a selected Deck whose storage mode changed after preview", async () => {
    const deck = createDeck({ id: "selected", uid: "uid" });
    const preparedImport = prepareDeckImport(
      {
        destination: { type: "existing", deckId: deck.id },
        rows: [
          {
            rowNumber: 1,
            card: { frontText: "front", backText: "back", tags: [], uniqueKey: "key" },
          },
        ],
      },
      { uid: "uid", decks: [deck], cards: [], generateCardId: vi.fn(() => "card") }
    );
    const mutateCards = vi.fn();

    await expect(
      executePreparedDeckImport(preparedImport, {
        uid: "uid",
        createDeck: vi.fn(),
        mutateCards,
        loadDeck: vi.fn(async () => ({ ...deck, localMode: true })),
      })
    ).rejects.toThrow("no longer uses the chosen storage mode");
    expect(mutateCards).not.toHaveBeenCalled();
  });
});
