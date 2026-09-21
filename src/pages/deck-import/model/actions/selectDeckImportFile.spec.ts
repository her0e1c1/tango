import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAuthUid } from "@/entities/auth";
import { generateCardId, mutateCards } from "@/entities/card";
import { generateDeckId, createDeck } from "@/entities/deck";
import { parseCsv } from "../../lib/cardCsv";
import { deckImportStore } from "../store";
import { selectDeckImportFile } from "./selectDeckImportFile";
import { importDeckPreview } from "./importDeckPreview";

vi.mock("@/entities/auth", () => ({ getAuthUid: vi.fn() }));
vi.mock("../../lib/cardCsv", () => ({ parseCsv: vi.fn() }));
vi.mock("@/shared/ui/toast", () => ({ showToast: vi.fn() }));
vi.mock("@/entities/card", () => ({ generateCardId: vi.fn(), mutateCards: vi.fn() }));
vi.mock("@/entities/deck", () => ({ generateDeckId: vi.fn(), createDeck: vi.fn() }));

describe("Deck import selection and saving [IMPORT-01 IMPORT-03 IMPORT-04]", () => {
  const row = {
    rowNumber: 1,
    card: { frontText: "front", backText: "back", tags: ["tag"], uniqueKey: "key-1" },
  };
  const rows = [row];

  const file = (name: string) => new File(["front,back,tag,key-1"], name, { type: "text/csv" });

  beforeEach(() => {
    deckImportStore.setState(deckImportStore.getInitialState(), true);
    vi.mocked(getAuthUid).mockReturnValue("uid");
    vi.mocked(parseCsv).mockResolvedValue({ rows, skippedRows: [], issues: [], invalidCount: 0 });
    vi.mocked(createDeck).mockReset();
    vi.mocked(mutateCards).mockReset();
    vi.mocked(generateDeckId).mockReset().mockReturnValue("deck");
    vi.mocked(generateCardId).mockReset().mockReturnValue("card");
  });

  it("previews a remote CSV before saving its Deck and Cards", async () => {
    await selectDeckImportFile(file("deck.csv"));
    expect(createDeck).not.toHaveBeenCalled();
    expect(mutateCards).not.toHaveBeenCalled();
    await expect(importDeckPreview()).resolves.toBe(true);

    expect(createDeck).toHaveBeenCalledWith("uid", { id: "deck", name: "deck.csv" });
    expect(mutateCards).toHaveBeenCalledWith("uid", [
      {
        kind: "create",
        card: { ...row.card, id: "card", deckId: "deck" },
      },
    ]);
  });

  it("saves same-name selections with distinct Deck and Card identities", async () => {
    vi.mocked(generateDeckId).mockReturnValueOnce("deck-1").mockReturnValueOnce("deck-2");
    vi.mocked(generateCardId).mockReturnValueOnce("card-1").mockReturnValueOnce("card-2");

    await selectDeckImportFile(file("same.csv"));
    await expect(importDeckPreview()).resolves.toBe(true);
    await selectDeckImportFile(file("same.csv"));
    await expect(importDeckPreview()).resolves.toBe(true);

    for (const suffix of ["1", "2"]) {
      expect(createDeck).toHaveBeenCalledWith("uid", { id: `deck-${suffix}`, name: "same.csv" });
      expect(mutateCards).toHaveBeenCalledWith("uid", [
        { kind: "create", card: { ...row.card, id: `card-${suffix}`, deckId: `deck-${suffix}` } },
      ]);
    }
  });

  it("imports using the anonymous UID", async () => {
    vi.mocked(getAuthUid).mockReturnValue("anonymous-uid");
    vi.mocked(generateDeckId).mockReturnValue("local-deck");
    vi.mocked(generateCardId).mockReturnValue("local-card");

    await selectDeckImportFile(file("local.csv"));
    await expect(importDeckPreview()).resolves.toBe(true);

    expect(createDeck).toHaveBeenCalledWith("anonymous-uid", { id: "local-deck", name: "local.csv" });
    expect(mutateCards).toHaveBeenCalledWith("anonymous-uid", [
      {
        kind: "create",
        card: { ...row.card, id: "local-card", deckId: "local-deck" },
      },
    ]);
  });

  it("uses the same API for anonymous imports", async () => {
    vi.mocked(getAuthUid).mockReturnValue("anonymous-uid");
    await selectDeckImportFile(file("guest.csv"));
    await expect(importDeckPreview()).resolves.toBe(true);

    expect(createDeck).toHaveBeenCalledWith("anonymous-uid", { id: "deck", name: "guest.csv" });
    expect(mutateCards).toHaveBeenCalledWith("anonymous-uid", [
      { kind: "create", card: { ...row.card, id: "card", deckId: "deck" } },
    ]);
  });
});
