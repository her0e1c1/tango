import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { createCard, createDeck } from "@/test/factories";
import { prepareDeckImport, prepareSampleDeckImport } from "./useDeckImportExecution";

describe("prepareDeckImport", () => {
  const row = {
    rowNumber: 1,
    card: { frontText: "front", backText: "back", tags: ["tag"], uniqueKey: "key-1" },
  };
  const rows = [row];

  it("prepares a Card creation and its preview action together", () => {
    const preparedImport = prepareDeckImport(
      { name: "deck.csv", rows },
      { uid: "uid", generateCardId: vi.fn(() => "card") }
    );

    expect(preparedImport.plan).toMatchObject({ created: 1, updated: 0, unchanged: 0 });
    expect(preparedImport.mutations).toEqual([
      { kind: "create", card: expect.objectContaining({ id: "card", uniqueKey: "key-1" }) },
    ]);
  });

  it("prepares local Deck and Card creation without an account owner", () => {
    const preparedImport = prepareDeckImport(
      { name: "local.csv", rows, storageMode: "local" },
      { uid: "", generateCardId: vi.fn(() => "local-card") }
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
