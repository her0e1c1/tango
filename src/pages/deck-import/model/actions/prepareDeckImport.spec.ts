import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateCardId } from "@/entities/card";
import { generateDeckId } from "@/entities/deck";
import { prepareDeckImport } from "./prepareDeckImport";

vi.mock("@/entities/card", () => ({ generateCardId: vi.fn() }));
vi.mock("@/entities/deck", () => ({ generateDeckId: vi.fn() }));

describe("prepareDeckImport [IMPORT-01]", () => {
  const row = {
    rowNumber: 1,
    card: { frontText: "front", backText: "back", tags: ["tag"], uniqueKey: "key-1" },
  };
  const rows = [row];

  beforeEach(() => {
    vi.mocked(generateDeckId).mockReset().mockReturnValue("deck");
    vi.mocked(generateCardId).mockReset().mockReturnValue("card");
  });

  it("prepares a new remote Deck and Card creations", () => {
    const preparedImport = prepareDeckImport({ name: "deck.csv", rows }, "uid");

    expect(preparedImport.destination).toEqual({ id: "deck", name: "deck.csv", localMode: false });
    expect(preparedImport.mutations).toEqual([
      {
        kind: "create",
        card: { ...row.card, id: "card", deckId: "deck", uid: "uid" },
      },
    ]);
  });

  it("generates a new destination for every preparation", () => {
    vi.mocked(generateDeckId).mockReturnValueOnce("deck-1").mockReturnValueOnce("deck-2");
    vi.mocked(generateCardId).mockReturnValueOnce("card-1").mockReturnValueOnce("card-2");

    const first = prepareDeckImport({ name: "same.csv", rows }, "uid");
    const second = prepareDeckImport({ name: "same.csv", rows }, "uid");

    expect(first.destination.id).toBe("deck-1");
    expect(second.destination.id).toBe("deck-2");
    expect(first.mutations[0]).toMatchObject({ kind: "create", card: { id: "card-1", deckId: "deck-1" } });
    expect(second.mutations[0]).toMatchObject({ kind: "create", card: { id: "card-2", deckId: "deck-2" } });
  });

  it("prepares local Deck and Card creation without an account owner", () => {
    vi.mocked(generateDeckId).mockReturnValue("local-deck");
    vi.mocked(generateCardId).mockReturnValue("local-card");

    const preparedImport = prepareDeckImport({ name: "local.csv", rows, storageMode: "local" }, "");

    expect(preparedImport.destination).toEqual({ id: "local-deck", name: "local.csv", localMode: true });
    expect(preparedImport.mutations).toEqual([
      {
        kind: "create",
        card: { ...row.card, id: "local-card", deckId: "local-deck" },
      },
    ]);
  });

  it("requires a confirmed user for a remote import", () => {
    expect(() => prepareDeckImport({ name: "remote.csv", rows }, "")).toThrow(
      "A confirmed user is required for remote imports"
    );
  });
});
