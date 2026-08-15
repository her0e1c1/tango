import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { createCard, createDeck } from "@/test/factories";
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
    expect(attempt.remainingMutations).toEqual([
      { kind: "create", card: expect.objectContaining({ id: "card", uniqueKey: "key-1" }) },
    ]);
  });

  it("prepares an update from the Card with the same unique key", () => {
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
      { uid: deck.uid, decks: [deck], cards: [existing], generateCardId: vi.fn() }
    );

    expect(attempt.plan).toMatchObject({ created: 0, updated: 1, unchanged: 0 });
    expect(attempt.remainingMutations).toEqual([
      { kind: "edit", card: expect.objectContaining({ id: existing.id, frontText: "front" }) },
    ]);
  });

  it("skips a Card with identical editable content", () => {
    const deck = createDeck({ id: "deck", name: "deck.csv", uid: "uid" });
    const existing = createCard({ ...row.card, deckId: deck.id, uid: deck.uid });
    const attempt = prepareDeckImport(
      { name: deck.name, rows },
      { uid: deck.uid, decks: [deck], cards: [existing], generateCardId: vi.fn() }
    );

    expect(attempt.plan).toMatchObject({ created: 0, updated: 0, unchanged: 1 });
    expect(attempt.remainingMutations).toEqual([]);
  });
});
