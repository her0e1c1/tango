/**
 * @file Verifies the "useDeckImport" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "keeps retry orchestration
 * stable across an unchanged render", "previews a file without writing until import is confirmed",
 * "keeps invalid files in preview without mutating state".
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCard, createConfig, createDeck } from "@/test/factories";
import type { DeckImportResult } from "@/features/import/components/deckImportTypes";
import { CardBulkMutationError } from "@/query/mutations/cardMutationService";

const mocks = vi.hoisted(() => ({
  uid: "uid-a",
  config: {} as ConfigState,
  decks: [] as Deck[],
  cards: [] as Card[],
  parseDeckImportCsv: vi.fn(),
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
  useAuth: () =>
    mocks.uid === "" ? { status: "anonymous" } : { status: "authenticated", uid: mocks.uid, user: { uid: mocks.uid } },
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
vi.mock("@/features/import/lib/deckImportAnalysis", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/import/lib/deckImportAnalysis")>();
  return {
    ...actual,
    parseDeckImportCsv: (...args: Parameters<typeof actual.parseDeckImportCsv>) => mocks.parseDeckImportCsv(...args),
  };
});
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
    mocks.uid = "uid-a";
    mocks.config = createConfig({ githubAccessToken: "" });
    mocks.decks = [];
    mocks.cards = [];
    mocks.parseDeckImportCsv.mockImplementation(async (content: string | File) => {
      const { parseDeckImportCsv } = await vi.importActual<typeof import("@/features/import/lib/deckImportAnalysis")>(
        "@/features/import/lib/deckImportAnalysis"
      );
      return parseDeckImportCsv(content);
    });
    mocks.parseCsv.mockResolvedValue([{ frontText: "front", backText: "back", tags: [], uniqueKey: "key" }]);
    mocks.prepareDeck.mockReturnValue(createDeck({ id: "deck", uid: "uid-a" }));
    mocks.prepareCard.mockReturnValue(createCard({ id: "card", deckId: "deck" }));
    mocks.createDeck.mockResolvedValue(undefined);
    mocks.bulkUpsert.mockResolvedValue(undefined);
  });

  it("keeps retry orchestration stable across an unchanged render", () => {
    const { result, rerender } = renderHook(useDeckImport);
    const retry = result.current.retry;

    rerender();

    expect(result.current.retry).toBe(retry);
  });

  it("previews a file without writing until import is confirmed", async () => {
    const { result } = renderHook(useDeckImport);
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
    const { result } = renderHook(useDeckImport);
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
    const { result } = renderHook(useDeckImport);
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
    const { result } = renderHook(useDeckImport);

    await act(async () => result.current.addSample());

    expect(mocks.prepareDeck).toHaveBeenCalledWith({ name: "Sample Deck" }, "uid-a", mocks.generateDeckId);
    expect(mocks.createDeck).toHaveBeenCalledWith(
      expect.objectContaining({ id: sampleDeckId("uid-a"), name: "Deck", uid: "uid-a" })
    );
    expect(mocks.bulkUpsert).toHaveBeenCalledOnce();
  });

  it("reuses the same sample Deck for the active user", async () => {
    mocks.decks = [createDeck({ id: sampleDeckId("uid-a"), name: "Renamed sample" })];
    const { result } = renderHook(useDeckImport);

    await act(async () => result.current.addSample());

    expect(mocks.createDeck).not.toHaveBeenCalled();
    expect(mocks.bulkUpsert).toHaveBeenCalledOnce();
  });

  it("treats a non-2xx URL response as an error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("missing", { status: 404 }));
    const { result } = renderHook(useDeckImport);

    await expect(result.current.importUrl("https://example.test/deck.csv")).rejects.toThrow(
      "Unable to fetch Deck CSV (404)"
    );
    expect(mocks.createDeck).not.toHaveBeenCalled();
  });

  it("rejects a second import while the first is pending", async () => {
    let finish!: () => void;
    mocks.bulkUpsert.mockReturnValueOnce(new Promise<void>((resolve) => (finish = resolve)));
    const { result } = renderHook(useDeckImport);
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
    const { result } = renderHook(useDeckImport);
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

  it("clears operation data and error when a new file is selected", async () => {
    const { result } = renderHook(useDeckImport);
    const file = new File(['"front","back","","key"'], "deck.csv", { type: "text/csv" });
    await act(async () => result.current.addSample());
    expect(result.current.data).toBeDefined();

    mocks.bulkUpsert.mockRejectedValueOnce(new Error("failed"));
    await act(async () => {
      await expect(result.current.addSample()).rejects.toThrow("failed");
    });
    expect(result.current.error).toBeDefined();

    await act(async () => result.current.selectFile(file));
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it("ignores completion from an old UID operation", async () => {
    let finishOld!: () => void;
    mocks.bulkUpsert.mockReturnValueOnce(new Promise<void>((resolve) => (finishOld = resolve)));
    const { result, rerender } = renderHook(useDeckImport);

    let oldOperation!: Promise<DeckImportResult>;
    act(() => {
      oldOperation = result.current.addSample();
    });
    await waitFor(() => expect(result.current.pending).toBe(true));
    mocks.uid = "uid-b";
    rerender();
    await waitFor(() => expect(result.current.pending).toBe(false));

    finishOld();
    await oldOperation;
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
    expect(result.current.pending).toBe(false);
  });

  it("does not write a slow URL import after the initiating UID changes", async () => {
    let finishFetch!: (response: Response) => void;
    vi.spyOn(globalThis, "fetch").mockReturnValueOnce(new Promise<Response>((resolve) => (finishFetch = resolve)));
    const { result, rerender } = renderHook(useDeckImport);

    const operation = result.current.importUrl("https://example.test/deck.csv");
    const rejection = expect(operation).rejects.toThrow("user changed");
    mocks.uid = "uid-b";
    rerender();
    finishFetch(new Response('"front","back","","key"'));

    await rejection;
    expect(mocks.createDeck).not.toHaveBeenCalled();
    expect(mocks.bulkUpsert).not.toHaveBeenCalled();
    expect(result.current.pending).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBeUndefined();
  });

  it("does not publish or import a file preview after an A-to-B-to-A UID transition", async () => {
    let finishParse!: (analysis: Awaited<ReturnType<typeof mocks.parseDeckImportCsv>>) => void;
    mocks.parseDeckImportCsv.mockReturnValueOnce(
      new Promise((resolve) => {
        finishParse = resolve;
      })
    );
    const { result, rerender } = renderHook(useDeckImport);
    const file = new File(['"stale-front","stale-back","","stale-key"'], "stale.csv", {
      type: "text/csv",
    });

    let selection!: ReturnType<typeof result.current.selectFile>;
    act(() => {
      selection = result.current.selectFile(file);
    });
    const rejection = expect(selection).rejects.toThrow("user changed");
    await waitFor(() => expect(result.current.validating).toBe(true));
    mocks.uid = "uid-b";
    rerender();
    mocks.uid = "uid-a";
    rerender();
    await act(async () => {
      finishParse({
        rows: [
          {
            rowNumber: 1,
            card: { frontText: "stale-front", backText: "stale-back", tags: [], uniqueKey: "stale-key" },
          },
        ],
        skippedRows: [],
        issues: [],
        invalidCount: 0,
      });
      await rejection;
    });
    expect(result.current.preview).toBeUndefined();
    expect(result.current.validating).toBe(false);
    await expect(result.current.importPreview()).rejects.toThrow("Select a CSV file");
    expect(mocks.createDeck).not.toHaveBeenCalled();
    expect(mocks.bulkUpsert).not.toHaveBeenCalled();
  });

  it("does not resurrect import data after an A-to-B-to-A UID transition", async () => {
    const { result, rerender } = renderHook(useDeckImport);
    await act(async () => result.current.addSample());
    expect(result.current.data).toBeDefined();

    mocks.uid = "uid-b";
    rerender();
    mocks.uid = "uid-a";
    rerender();

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it("does not resurrect import running state after an A-to-B-to-A UID transition", async () => {
    let finish!: () => void;
    mocks.bulkUpsert.mockReturnValueOnce(new Promise<void>((resolve) => (finish = resolve)));
    const { result, rerender } = renderHook(useDeckImport);

    let operation!: Promise<DeckImportResult>;
    act(() => {
      operation = result.current.addSample();
    });
    await waitFor(() => expect(result.current.pending).toBe(true));
    mocks.uid = "uid-b";
    rerender();
    mocks.uid = "uid-a";
    rerender();

    expect(result.current.pending).toBe(false);
    await act(async () => {
      finish();
      await operation;
    });
  });

  it("keeps successful import rows successful when authoritative recovery fails", async () => {
    const first = createCard({ id: "first", deckId: "deck", uniqueKey: "first" });
    const second = createCard({ id: "second", deckId: "deck", uniqueKey: "second" });
    mocks.prepareCard.mockReturnValueOnce(first).mockReturnValueOnce(second);
    mocks.bulkUpsert.mockRejectedValueOnce(
      new CardBulkMutationError([second.id], 2, { cause: new Error("authoritative read failed") })
    );
    const { result } = renderHook(useDeckImport);
    const file = new File(['"front-1","back-1","","first"\n"front-2","back-2","","second"'], "deck.csv", {
      type: "text/csv",
    });

    await act(async () => result.current.selectFile(file));
    await act(async () => {
      await expect(result.current.importPreview()).rejects.toThrow("did not complete");
    });

    expect(result.current.partialResult).toEqual({
      created: 1,
      updated: 0,
      skipped: 0,
      failed: 1,
      deckId: "deck",
    });
  });
});
