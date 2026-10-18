import { showToast } from "@/shared/ui/toast";
import { generateId } from "@/shared/lib/generateId";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAuthUid } from "@/entities/auth";
import { createCard } from "@/entities/card";
import { createDeck } from "@/entities/deck";
import { parseCsv } from "../../lib/cardCsv";
import { deckImportStore } from "../store";
import { selectDeckImportFile } from "./selectDeckImportFile";
import { importDeckPreview } from "./importDeckPreview";

vi.mock("@/shared/lib/generateId", () => ({ generateId: vi.fn() }));
vi.mock("@/entities/auth", () => ({ getAuthUid: vi.fn() }));
vi.mock("../../lib/cardCsv", () => ({ parseCsv: vi.fn() }));
vi.mock("@/shared/ui/toast", () => ({ showToast: vi.fn() }));
vi.mock("@/entities/card", () => ({ createCard: vi.fn() }));
vi.mock("@/entities/deck", () => ({ createDeck: vi.fn() }));

describe("Deck import selection and saving [DECK-IMPORT-01 DECK-IMPORT-03 DECK-IMPORT-04]", () => {
  const row = {
    rowNumber: 1,
    card: { frontText: "front", backText: "back", tags: ["tag"], uniqueKey: "key-1" },
  };
  const rows = [row];

  const file = (name: string) => new File(["front,back,tag,key-1"], name, { type: "text/csv" });

  beforeEach(() => {
    // Given: Establish the shared setup used by the following cases.
    deckImportStore.setState(deckImportStore.getInitialState(), true);
    vi.mocked(getAuthUid).mockReturnValue("uid");
    vi.mocked(parseCsv).mockReset().mockResolvedValue({ rows, skippedRows: [], issues: [], invalidCount: 0 });
    vi.mocked(createDeck).mockReset();
    vi.mocked(createCard).mockReset();
    vi.mocked(generateId).mockReset().mockReturnValueOnce("deck").mockReturnValue("card");
  });

  it.each([[0x82, 0xa0], [0xc3], [0xc0, 0xaf], [0xed, 0xa0, 0x80]])(
    "rejects invalid UTF-8 bytes %j before parsing and releases the selection lock",
    async (...bytes) => {
      // Given: Use this case's inputs and any shared test setup.
      // When: Exercise `selectDeckImportFile` with the prepared inputs.
      await selectDeckImportFile(file("previous.csv"));
      vi.mocked(parseCsv).mockClear();
      const invalid = new File([new Uint8Array([...bytes, 44, 98, 44, 44, 107])], "invalid.csv");
      await selectDeckImportFile(invalid);
      // Then: Verify the expected result in the assertions below.
      expect(parseCsv).not.toHaveBeenCalled();
      expect(deckImportStore.getState()).toMatchObject({ status: "idle", source: { kind: "error" } });
      expect(await importDeckPreview()).toBe(false);
      expect(createDeck).not.toHaveBeenCalled();
      expect(createCard).not.toHaveBeenCalled();
      // When: Exercise `selectDeckImportFile` with the prepared inputs.
      await selectDeckImportFile(file("recovered.csv"));
      // Then: Verify the expected result in the assertions below.
      expect(await importDeckPreview()).toBe(true);
    }
  );

  it("passes valid Japanese and literal replacement characters to the CSV parser unchanged", async () => {
    // Given: Prepare `text` and any shared test state below.
    const text = "日本語,回答,タグ,key";
    // When: Exercise `selectDeckImportFile` with the prepared inputs.
    await selectDeckImportFile(new File([text], "valid.csv"));
    // Then: Verify the expected result in the assertions below.
    expect(parseCsv).toHaveBeenCalledWith(text);
  });

  it("previews a remote CSV before saving its Deck and Cards", async () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `selectDeckImportFile` with the prepared inputs.
    await selectDeckImportFile(file("deck.csv"));
    // Then: Verify the expected result in the assertions below.
    expect(createDeck).not.toHaveBeenCalled();
    expect(createCard).not.toHaveBeenCalled();
    await expect(importDeckPreview()).resolves.toBe(true);

    expect(createDeck).toHaveBeenCalledWith("uid", { id: "deck", name: "deck.csv" });
    expect(createCard).toHaveBeenCalledWith("uid", { ...row.card, id: "card", deckId: "deck" });
  });

  it.each(["success", "failure"])("detaches an old account import on %s and permits a new import", async (outcome) => {
    // Given: Prepare `pending` and any shared test state below.
    await selectDeckImportFile(file("deck.csv"));
    const pending = Promise.withResolvers<void>();
    vi.mocked(createDeck).mockReturnValueOnce(pending.promise);
    vi.mocked(showToast).mockClear();
    // When: Exercise `importDeckPreview` with the prepared inputs.
    const result = importDeckPreview();
    vi.mocked(getAuthUid).mockReturnValue("next-user");
    if (outcome === "failure") pending.reject(new Error("denied"));
    else pending.resolve();
    // Then: Verify the expected result in the assertions below.
    await expect(result).resolves.toBe(false);
    expect(showToast).not.toHaveBeenCalled();
    expect(deckImportStore.getState().status).toBe("idle");
    // When: Exercise `selectDeckImportFile` with the prepared inputs.
    await selectDeckImportFile(file("new-account.csv"));
    // Then: Verify the expected result in the assertions below.
    await expect(importDeckPreview()).resolves.toBe(true);
  });

  it.each(["success", "failure"])(
    "discards a file read that finishes with %s after changing accounts",
    async (outcome) => {
      // Given: Prepare `previous`, `bytes`, `pending` and any shared test state below.
      const previous = file("previous-account.csv");
      const bytes = await previous.arrayBuffer();
      const pending = Promise.withResolvers<ArrayBuffer>();
      Object.defineProperty(previous, "arrayBuffer", { value: () => pending.promise });

      // When: Exercise `selectDeckImportFile` with the prepared inputs.
      const selection = selectDeckImportFile(previous);
      // Then: Verify the expected result in the assertions below.
      expect(deckImportStore.getState().status).toBe("validating");
      vi.mocked(getAuthUid).mockReturnValue("next-user");
      // When: Apply the operation or event under test.
      if (outcome === "failure") pending.reject(new Error("Previous account's file could not be read"));
      else pending.resolve(bytes);
      await selection;

      // Then: Verify the expected result in the assertions below.
      expect(deckImportStore.getState()).toMatchObject({ status: "idle", source: { kind: "empty" } });
      await expect(importDeckPreview()).resolves.toBe(false);
      expect(createDeck).not.toHaveBeenCalled();
      expect(createCard).not.toHaveBeenCalled();

      // When: Exercise `selectDeckImportFile` with the prepared inputs.
      await selectDeckImportFile(file("new-account.csv"));
      // Then: Verify the expected result in the assertions below.
      expect(deckImportStore.getState()).toMatchObject({
        status: "idle",
        source: { kind: "selected", preview: { deckName: "new-account.csv" } },
      });
      await expect(importDeckPreview()).resolves.toBe(true);
      expect(createDeck).toHaveBeenCalledWith("next-user", expect.objectContaining({ name: "new-account.csv" }));
      expect(createCard).toHaveBeenCalledWith("next-user", expect.objectContaining({ frontText: "front" }));
    }
  );

  it("imports using the anonymous UID", async () => {
    // Given: Use this case's inputs and any shared test setup.
    vi.mocked(getAuthUid).mockReturnValue("anonymous-uid");
    vi.mocked(generateId).mockReset().mockReturnValueOnce("local-deck").mockReturnValue("local-card");

    // When: Exercise `selectDeckImportFile` with the prepared inputs.
    await selectDeckImportFile(file("local.csv"));
    // Then: Verify the expected result in the assertions below.
    await expect(importDeckPreview()).resolves.toBe(true);

    expect(createDeck).toHaveBeenCalledWith("anonymous-uid", { id: "local-deck", name: "local.csv" });
    expect(createCard).toHaveBeenCalledWith("anonymous-uid", { ...row.card, id: "local-card", deckId: "local-deck" });
  });

  it("uses the same API for anonymous imports", async () => {
    // Given: Use this case's inputs and any shared test setup.
    vi.mocked(getAuthUid).mockReturnValue("anonymous-uid");
    // When: Exercise `selectDeckImportFile` with the prepared inputs.
    await selectDeckImportFile(file("guest.csv"));
    // Then: Verify the expected result in the assertions below.
    await expect(importDeckPreview()).resolves.toBe(true);

    expect(createDeck).toHaveBeenCalledWith("anonymous-uid", { id: "deck", name: "guest.csv" });
    expect(createCard).toHaveBeenCalledWith("anonymous-uid", { ...row.card, id: "card", deckId: "deck" });
  });
});
