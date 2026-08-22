import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { prepareDeckImport } from "./useDeckImportExecution";

describe("prepareDeckImport", () => {
  const row = {
    rowNumber: 1,
    card: { frontText: "front", backText: "back", tags: ["tag"], uniqueKey: "key-1" },
  };
  const rows = [row];

  it("prepares a new remote Deck and Card creations", () => {
    const preparedImport = prepareDeckImport(
      { name: "deck.csv", rows },
      {
        uid: "uid",
        generateDeckId: vi.fn(() => "deck"),
        generateCardId: vi.fn(() => "card"),
      }
    );

    expect(preparedImport.destination).toEqual({ id: "deck", uid: "uid", name: "deck.csv" });
    expect(preparedImport.mutations).toEqual([
      {
        kind: "create",
        card: { ...row.card, id: "card", deckId: "deck", uid: "uid" },
      },
    ]);
  });

  it("generates a new destination for every preparation", () => {
    const generateDeckId = vi.fn().mockReturnValueOnce("deck-1").mockReturnValueOnce("deck-2");
    const dependencies = {
      uid: "uid",
      generateDeckId,
      generateCardId: vi.fn().mockReturnValueOnce("card-1").mockReturnValueOnce("card-2"),
    };

    const first = prepareDeckImport({ name: "same.csv", rows }, dependencies);
    const second = prepareDeckImport({ name: "same.csv", rows }, dependencies);

    expect(first.destination.id).toBe("deck-1");
    expect(second.destination.id).toBe("deck-2");
    expect(first.mutations[0]).toMatchObject({ kind: "create", card: { id: "card-1", deckId: "deck-1" } });
    expect(second.mutations[0]).toMatchObject({ kind: "create", card: { id: "card-2", deckId: "deck-2" } });
  });

  it("prepares local Deck and Card creation without an account owner", () => {
    const preparedImport = prepareDeckImport(
      { name: "local.csv", rows, storageMode: "local" },
      {
        uid: "",
        generateDeckId: vi.fn(() => "local-deck"),
        generateCardId: vi.fn(() => "local-card"),
      }
    );

    expect(preparedImport.destination).toEqual({ id: "local-deck", name: "local.csv", localMode: true });
    expect(preparedImport.mutations).toEqual([
      {
        kind: "create",
        card: { ...row.card, id: "local-card", deckId: "local-deck" },
      },
    ]);
  });

  it("requires a confirmed user for a remote import", () => {
    expect(() =>
      prepareDeckImport(
        { name: "remote.csv", rows },
        { uid: "", generateDeckId: vi.fn(() => "deck"), generateCardId: vi.fn(() => "card") }
      )
    ).toThrow("A confirmed user is required for remote imports");
  });
});
