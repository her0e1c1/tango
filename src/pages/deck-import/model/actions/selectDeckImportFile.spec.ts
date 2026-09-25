import { showToast } from "@/shared/ui/toast";
import { generateId } from "@/shared/lib/generateId";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAuthUid } from "@/entities/auth";
import { mutateCards } from "@/entities/card";
import { createDeck } from "@/entities/deck";
import { parseCsv } from "../../lib/cardCsv";
import { deckImportStore } from "../store";
import { selectDeckImportFile } from "./selectDeckImportFile";
import { importDeckPreview } from "./importDeckPreview";

vi.mock("@/shared/lib/generateId", () => ({ generateId: vi.fn() }));
vi.mock("@/entities/auth", () => ({ getAuthUid: vi.fn() }));
vi.mock("../../lib/cardCsv", () => ({ parseCsv: vi.fn() }));
vi.mock("@/shared/ui/toast", () => ({ showToast: vi.fn() }));
vi.mock("@/entities/card", () => ({ mutateCards: vi.fn() }));
vi.mock("@/entities/deck", () => ({ createDeck: vi.fn() }));

describe("Deck import selection and saving [DECK-IMPORT-01 DECK-IMPORT-03 DECK-IMPORT-04]", () => {
  const row = {
    rowNumber: 1,
    card: { frontText: "front", backText: "back", tags: ["tag"], uniqueKey: "key-1" },
  };
  const rows = [row];

  const file = (name: string) => new File(["front,back,tag,key-1"], name, { type: "text/csv" });

  beforeEach(() => {
    deckImportStore.setState(deckImportStore.getInitialState(), true);
    vi.mocked(getAuthUid).mockReturnValue("uid");
    vi.mocked(parseCsv).mockReset().mockResolvedValue({ rows, skippedRows: [], issues: [], invalidCount: 0 });
    vi.mocked(createDeck).mockReset();
    vi.mocked(mutateCards).mockReset();
    vi.mocked(generateId).mockReset().mockReturnValueOnce("deck").mockReturnValue("card");
  });

  it.each([[0x82, 0xa0], [0xc3], [0xc0, 0xaf], [0xed, 0xa0, 0x80]])(
    "rejects invalid UTF-8 bytes %j before parsing and releases the selection lock",
    async (...bytes) => {
      await selectDeckImportFile(file("previous.csv"));
      vi.mocked(parseCsv).mockClear();
      const invalid = new File([new Uint8Array([...bytes, 44, 98, 44, 44, 107])], "invalid.csv");
      await selectDeckImportFile(invalid);
      expect(parseCsv).not.toHaveBeenCalled();
      expect(deckImportStore.getState()).toMatchObject({ status: "idle", source: { kind: "error" } });
      expect(await importDeckPreview()).toBe(false);
      expect(createDeck).not.toHaveBeenCalled();
      expect(mutateCards).not.toHaveBeenCalled();
      await selectDeckImportFile(file("recovered.csv"));
      expect(await importDeckPreview()).toBe(true);
    }
  );

  it("passes valid Japanese and literal replacement characters to the CSV parser unchanged", async () => {
    const text = "日本語�,回答�,タグ,key";
    await selectDeckImportFile(new File([text], "valid.csv"));
    expect(parseCsv).toHaveBeenCalledWith(text);
  });

  it("previews a remote CSV before saving its Deck and Cards", async () => {
    await selectDeckImportFile(file("deck.csv"));
    expect(createDeck).not.toHaveBeenCalled();
    expect(mutateCards).not.toHaveBeenCalled();
    await expect(importDeckPreview()).resolves.toBe(true);

    expect(createDeck).toHaveBeenCalledWith("uid", { id: "deck", name: "deck.csv" }, expect.any(Function));
    expect(mutateCards).toHaveBeenCalledWith(
      "uid",
      [
        {
          kind: "create",
          card: { ...row.card, id: "card", deckId: "deck" },
        },
      ],
      expect.any(Function)
    );
  });

  it.each(["success", "failure"])("detaches an old account import on %s and permits a new import", async (outcome) => {
    await selectDeckImportFile(file("deck.csv"));
    const pending = Promise.withResolvers<void>();
    vi.mocked(createDeck).mockReturnValueOnce(pending.promise);
    vi.mocked(showToast).mockClear();
    const result = importDeckPreview();
    vi.mocked(getAuthUid).mockReturnValue("next-user");
    if (outcome === "failure") pending.reject(new Error("denied"));
    else pending.resolve();
    await expect(result).resolves.toBe(false);
    expect(showToast).not.toHaveBeenCalled();
    expect(deckImportStore.getState().status).toBe("idle");
    await selectDeckImportFile(file("new-account.csv"));
    await expect(importDeckPreview()).resolves.toBe(true);
  });

  it("imports using the anonymous UID", async () => {
    vi.mocked(getAuthUid).mockReturnValue("anonymous-uid");
    vi.mocked(generateId).mockReset().mockReturnValueOnce("local-deck").mockReturnValue("local-card");

    await selectDeckImportFile(file("local.csv"));
    await expect(importDeckPreview()).resolves.toBe(true);

    expect(createDeck).toHaveBeenCalledWith(
      "anonymous-uid",
      { id: "local-deck", name: "local.csv" },
      expect.any(Function)
    );
    expect(mutateCards).toHaveBeenCalledWith(
      "anonymous-uid",
      [
        {
          kind: "create",
          card: { ...row.card, id: "local-card", deckId: "local-deck" },
        },
      ],
      expect.any(Function)
    );
  });

  it("uses the same API for anonymous imports", async () => {
    vi.mocked(getAuthUid).mockReturnValue("anonymous-uid");
    await selectDeckImportFile(file("guest.csv"));
    await expect(importDeckPreview()).resolves.toBe(true);

    expect(createDeck).toHaveBeenCalledWith("anonymous-uid", { id: "deck", name: "guest.csv" }, expect.any(Function));
    expect(mutateCards).toHaveBeenCalledWith(
      "anonymous-uid",
      [{ kind: "create", card: { ...row.card, id: "card", deckId: "deck" } }],
      expect.any(Function)
    );
  });
});
