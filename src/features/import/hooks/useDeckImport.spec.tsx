/**
 * @file Verifies the "useDeckImport" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "keeps retry orchestration
 * stable across an unchanged render", "previews a file without writing until import is confirmed",
 * "keeps invalid files in preview without mutating state".
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createQueryWrapper, createTestQueryClient } from "@/query/testUtils";
import { createCard, createConfig, createDeck } from "@/test/factories";
import type { DeckImportResult } from "@/features/import/components/deckImportTypes";
import { CardBulkMutationError } from "@/query/mutations/cardMutationService";

const mocks = vi.hoisted(() => ({
  config: {} as ConfigState,
  decks: [] as Deck[],
  cards: [] as Card[],
  parseCsv: vi.fn(),
  prepareDeck: vi.fn(),
  prepareCard: vi.fn(),
  generateDeckId: vi.fn(() => "generated-deck-id"),
  generateCardId: vi.fn(() => "generated-card-id"),
  createDeck: vi.fn(),
  bulkUpsert: vi.fn(),
}));

vi.mock("@/hooks/useConfig", () => ({ useConfig: () => mocks.config }));
vi.mock("@/auth/AuthContext", () => ({
  useAuth: () => ({ status: "authenticated", uid: "uid-a", user: { uid: "uid-a" } }),
}));
vi.mock("@/query/useRemoteCollections", () => ({
  useRemoteCollections: () => ({
    decks: mocks.decks,
    cardsByDeckId: (id: DeckId) => mocks.cards.filter((card) => card.deckId === id),
  }),
}));
vi.mock("@/features/deck/hooks/useDeckMutations", () => ({
  useDeckMutations: () => ({ create: mocks.createDeck }),
}));
vi.mock("@/features/card/hooks/useCardMutations", () => ({
  useCardMutations: () => ({ bulkUpsert: mocks.bulkUpsert }),
}));
vi.mock("@/action", () => ({
  deck: { parseCsv: mocks.parseCsv, prepare: mocks.prepareDeck },
  card: { prepare: mocks.prepareCard },
}));
vi.mock("@/adapters/firestore", () => ({
  documentMetadata: { generateDeckId: mocks.generateDeckId, generateCardId: mocks.generateCardId },
}));

import { sampleDeckId, useDeckImport } from "@/features/import/hooks/useDeckImport";

describe("useDeckImport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.config = createConfig({ githubAccessToken: "" });
    mocks.decks = [];
    mocks.cards = [];
    mocks.parseCsv.mockResolvedValue([{ frontText: "front", backText: "back", tags: [], uniqueKey: "key" }]);
    mocks.prepareDeck.mockReturnValue(createDeck({ id: "deck", uid: "uid-a" }));
    mocks.prepareCard.mockReturnValue(createCard({ id: "card", deckId: "deck" }));
    mocks.createDeck.mockResolvedValue(undefined);
    mocks.bulkUpsert.mockResolvedValue(undefined);
  });

  it("keeps retry orchestration stable across an unchanged render", () => {
    const { result, rerender } = renderHook(useDeckImport, { wrapper: createQueryWrapper(createTestQueryClient()) });
    const retry = result.current.retry;

    rerender();

    expect(result.current.retry).toBe(retry);
  });

  it("previews a file without writing until import is confirmed", async () => {
    const { result } = renderHook(useDeckImport, { wrapper: createQueryWrapper(createTestQueryClient()) });
    const file = new File(['"front","back","","key"'], "deck.csv", { type: "text/csv" });
    let imported: DeckImportResult | undefined;

    await act(async () => {
      await result.current.selectFile(file);
    });

    expect(result.current.preview).toMatchObject({
      fileName: "deck.csv",
      deckName: "deck.csv",
      analysis: { invalidCount: 0 },
      plan: { created: 1, updated: 0, unchanged: 0 },
    });
    expect(mocks.createDeck).not.toHaveBeenCalled();
    expect(mocks.bulkUpsert).not.toHaveBeenCalled();

    await act(async () => {
      imported = await result.current.importPreview();
    });
    expect(mocks.createDeck).toHaveBeenCalledOnce();
    expect(mocks.prepareDeck).toHaveBeenCalledWith({ name: "deck.csv" }, "uid-a", mocks.generateDeckId);
    expect(mocks.prepareCard).toHaveBeenCalledWith(expect.anything(), expect.anything(), mocks.generateCardId);
    expect(mocks.bulkUpsert).toHaveBeenCalledWith([expect.objectContaining({ id: "card" })]);
    expect(imported).toEqual({ created: 1, updated: 0, skipped: 0, failed: 0, deckId: "deck" });
  });

  it("keeps invalid files in preview without mutating state", async () => {
    const { result } = renderHook(useDeckImport, { wrapper: createQueryWrapper(createTestQueryClient()) });
    const file = new File(["front,back"], "invalid.csv", { type: "text/csv" });

    await act(async () => {
      await result.current.selectFile(file);
    });

    expect(result.current.preview).toMatchObject({
      analysis: {
        rows: [],
        invalidCount: 1,
        issues: [expect.objectContaining({ rowNumber: 1, message: "Expected 4 columns, found 2." })],
      },
    });
    await expect(result.current.importPreview()).rejects.toThrow("Fix invalid CSV rows");
    expect(mocks.createDeck).not.toHaveBeenCalled();
    expect(mocks.bulkUpsert).not.toHaveBeenCalled();
  });

  it("skips an identical CSV re-import by uniqueKey", async () => {
    mocks.decks = [createDeck({ id: "deck", name: "deck.csv", uid: "uid-a" })];
    mocks.cards = [
      createCard({
        id: "existing",
        deckId: "deck",
        frontText: "front",
        backText: "back",
        tags: [],
        uniqueKey: "key",
      }),
    ];
    const { result } = renderHook(useDeckImport, { wrapper: createQueryWrapper(createTestQueryClient()) });
    const file = new File(['"front","back","","key"'], "deck.csv", { type: "text/csv" });
    let imported: DeckImportResult | undefined;

    await act(async () => {
      await result.current.selectFile(file);
    });
    await act(async () => {
      imported = await result.current.importPreview();
    });

    expect(result.current.preview?.plan).toMatchObject({ created: 0, updated: 0, unchanged: 1 });
    expect(mocks.createDeck).not.toHaveBeenCalled();
    expect(mocks.bulkUpsert).not.toHaveBeenCalled();
    expect(imported).toEqual({ created: 0, updated: 0, skipped: 1, failed: 0, deckId: "deck" });
  });

  it("adds the bundled sample with a stable per-user Deck id", async () => {
    const { result } = renderHook(useDeckImport, { wrapper: createQueryWrapper(createTestQueryClient()) });

    await act(async () => result.current.addSample());

    expect(mocks.prepareDeck).toHaveBeenCalledWith({ name: "Sample Deck" }, "uid-a", mocks.generateDeckId);
    expect(mocks.createDeck).toHaveBeenCalledWith(
      expect.objectContaining({ id: sampleDeckId("uid-a"), name: "Deck", uid: "uid-a" })
    );
    expect(mocks.bulkUpsert).toHaveBeenCalledOnce();
  });

  it("reuses the same sample Deck for the active user", async () => {
    mocks.decks = [createDeck({ id: sampleDeckId("uid-a"), name: "Renamed sample" })];
    const { result } = renderHook(useDeckImport, { wrapper: createQueryWrapper(createTestQueryClient()) });

    await act(async () => result.current.addSample());

    expect(mocks.createDeck).not.toHaveBeenCalled();
    expect(mocks.bulkUpsert).toHaveBeenCalledOnce();
  });

  it("treats a non-2xx URL response as an error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("missing", { status: 404 }));
    const { result } = renderHook(useDeckImport, { wrapper: createQueryWrapper(createTestQueryClient()) });

    await expect(result.current.importUrl("https://example.test/deck.csv")).rejects.toThrow(
      "Unable to fetch Deck CSV (404)"
    );
    expect(mocks.createDeck).not.toHaveBeenCalled();
  });

  it("rejects a second import while the first is pending", async () => {
    let finish!: () => void;
    mocks.bulkUpsert.mockReturnValueOnce(new Promise<void>((resolve) => (finish = resolve)));
    const { result } = renderHook(useDeckImport, { wrapper: createQueryWrapper(createTestQueryClient()) });
    const file = new File(['"front","back","","key"'], "deck.csv", { type: "text/csv" });

    await act(async () => {
      await result.current.selectFile(file);
    });

    let first: Promise<DeckImportResult> | undefined;
    act(() => {
      first = result.current.importPreview();
    });
    await waitFor(() => expect(result.current.pending).toBe(true));
    await expect(result.current.importPreview()).rejects.toThrow("already running");
    await act(async () => {
      finish();
      await first;
    });
    expect(result.current.pending).toBe(false);
  });

  it("retains successful and failed counts after a partial Card write failure", async () => {
    mocks.prepareCard.mockReturnValue(createCard({ id: "card", deckId: "deck", uniqueKey: "key" }));
    mocks.bulkUpsert.mockRejectedValueOnce(new CardBulkMutationError(["card"], 1));
    const { result } = renderHook(useDeckImport, { wrapper: createQueryWrapper(createTestQueryClient()) });
    const file = new File(['"front","back","","key"'], "deck.csv", { type: "text/csv" });

    await act(async () => {
      await result.current.selectFile(file);
    });
    await act(async () => {
      await expect(result.current.importPreview()).rejects.toThrow("did not complete");
    });

    expect(result.current.partialResult).toEqual({
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 1,
      deckId: "deck",
    });
  });
});
