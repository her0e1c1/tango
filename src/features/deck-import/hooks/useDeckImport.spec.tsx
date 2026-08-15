/**
 * @file Verifies the "useDeckImport" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "previews a file without
 * writing until import is confirmed" and "keeps invalid files in preview without mutating state".
 */

import type { Card, CardCreateInput } from "@/entities/card";
import type { Deck, DeckCreateInput, DeckId } from "@/entities/deck";

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCard, createDeck } from "@/test/factories";
import type { DeckImportResult } from "../model/deckImportTypes";
import { CardBulkMutationError } from "../api/upsertImportedCards";
import { actAsync } from "@/test/act";

const mocks = vi.hoisted(() => ({
  uid: "uid-a",
  decks: [] as Deck[],
  cards: [] as Card[],
  parseCsv: vi.fn(),
  generateDeckId: vi.fn(() => "deck"),
  generateCardId: vi.fn(() => "card"),
  createCardWrite: vi.fn(),
  editCard: vi.fn(),
  createDeck: vi.fn(),
  bulkUpsert: vi.fn(),
}));

vi.mock("@/entities/auth", () => ({
  useAuthSession: () =>
    mocks.uid === ""
      ? { status: "signedOut" }
      : { status: "authenticated", uid: mocks.uid, isAnonymous: true, displayName: null },
}));
vi.mock("@/shared/api/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/entities/card", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/card")>();
  return {
    ...actual,
    filterCardsByDeckId: (cards: Card[], id: DeckId) => cards.filter((card) => card.deckId === id),
  };
});
vi.mock("../api/upsertImportedCards", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/upsertImportedCards")>();
  return {
    ...actual,
    upsertImportedCards: (_uid: string, cards: CardCreateInput[]) => mocks.bulkUpsert(cards),
  };
});
vi.mock("@/entities/deck", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/deck")>();
  return {
    ...actual,
    generateDeckId: mocks.generateDeckId,
  };
});
vi.mock("../lib/cardCsv", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/cardCsv")>();
  return { ...actual, parseCsv: mocks.parseCsv };
});
import { useDeckImport } from "./useDeckImport";

const useTestDeckImport = () =>
  useDeckImport({
    cards: mocks.cards,
    createCard: mocks.createCardWrite,
    createDeck: (_uid: string, deck: DeckCreateInput) => mocks.createDeck(deck),
    decks: mocks.decks,
    editCard: mocks.editCard,
    generateCardId: mocks.generateCardId,
  });

describe("useDeckImport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.uid = "uid-a";
    mocks.decks = [];
    mocks.cards = [];
    mocks.parseCsv.mockImplementation(async (content: string) => {
      const { parseCsv } = await vi.importActual<typeof import("../lib/cardCsv")>("../lib/cardCsv");
      return parseCsv(content);
    });
    mocks.generateDeckId.mockReturnValue("deck");
    mocks.generateCardId.mockReturnValue("card");
    mocks.createCardWrite.mockResolvedValue(undefined);
    mocks.editCard.mockResolvedValue(undefined);
    mocks.createDeck.mockResolvedValue(undefined);
    mocks.bulkUpsert.mockResolvedValue(undefined);
  });

  it("previews a file without writing until import is confirmed", async () => {
    const { result } = renderHook(useTestDeckImport);
    const file = new File(['"front","back","","key"'], "deck.csv", { type: "text/csv" });
    let imported: DeckImportResult | undefined;

    await actAsync(async () => {
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

    await actAsync(async () => {
      imported = await result.current.importPreview();
    });
    expect(mocks.createDeck).toHaveBeenCalledOnce();
    expect(mocks.createDeck).toHaveBeenCalledWith({ id: "deck", uid: "uid-a", name: "deck.csv" });
    expect(mocks.bulkUpsert).toHaveBeenCalledWith([
      {
        id: "card",
        deckId: "deck",
        uid: "uid-a",
        frontText: "front",
        backText: "back",
        tags: [],
        uniqueKey: "key",
      },
    ]);
    expect(imported).toEqual({ created: 1, updated: 0, skipped: 0, failed: 0, deckId: "deck" });
  });

  it("keeps invalid files in preview without mutating state", async () => {
    const { result } = renderHook(useTestDeckImport);
    const file = new File(["front,back"], "invalid.csv", { type: "text/csv" });

    await actAsync(async () => {
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
    const { result } = renderHook(useTestDeckImport);
    const file = new File(['"front","back","","key"'], "deck.csv", { type: "text/csv" });
    let imported: DeckImportResult | undefined;

    await actAsync(async () => {
      await result.current.selectFile(file);
    });
    await actAsync(async () => {
      imported = await result.current.importPreview();
    });

    expect(result.current.preview?.plan).toMatchObject({ created: 0, updated: 0, unchanged: 1 });
    expect(mocks.createDeck).not.toHaveBeenCalled();
    expect(mocks.bulkUpsert).not.toHaveBeenCalled();
    expect(imported).toEqual({ created: 0, updated: 0, skipped: 1, failed: 0, deckId: "deck" });
  });

  it("adds the bundled sample with a stable per-user Deck id", async () => {
    const { result } = renderHook(useTestDeckImport);

    await actAsync(async () => result.current.addSample());

    expect(mocks.createDeck).toHaveBeenCalledWith({
      id: "sample-v1-uid-a",
      name: "Sample Deck",
      uid: "uid-a",
    });
    expect(mocks.bulkUpsert).toHaveBeenCalledOnce();
  });

  it("reuses the same sample Deck for the active user", async () => {
    mocks.decks = [createDeck({ id: "sample-v1-uid-a", name: "Renamed sample" })];
    const { result } = renderHook(useTestDeckImport);

    await actAsync(async () => result.current.addSample());

    expect(mocks.createDeck).not.toHaveBeenCalled();
    expect(mocks.bulkUpsert).toHaveBeenCalledOnce();
  });

  it("treats a non-2xx URL response as an error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("missing", { status: 404 }));
    const { result } = renderHook(useTestDeckImport);

    await expect(result.current.importUrl("https://example.test/deck.csv")).rejects.toThrow(
      "Unable to fetch Deck CSV (404)"
    );
    expect(mocks.createDeck).not.toHaveBeenCalled();
  });

  it("fetches a public import URL without credentials", async () => {
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response('"front","back","","key"'));
    const { result } = renderHook(useTestDeckImport);

    await actAsync(async () => result.current.importUrl("https://example.test/deck.csv"));

    expect(fetch).toHaveBeenCalledWith(new URL("https://example.test/deck.csv"));
  });

  it("uses the same CSV analysis pipeline for File and URL input", async () => {
    const csv = '"front","back"," foo,foo "," key "';
    const normalizedCard = { frontText: "front", backText: "back", tags: ["foo"], uniqueKey: "key" };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(csv));
    const { result } = renderHook(useTestDeckImport);

    await actAsync(async () => result.current.selectFile(new File([csv], "deck.csv")));
    expect(result.current.preview?.analysis.rows).toEqual([{ rowNumber: 1, card: normalizedCard }]);

    await actAsync(async () => result.current.importUrl("https://example.test/deck.csv"));
    expect(mocks.bulkUpsert).toHaveBeenLastCalledWith([expect.objectContaining(normalizedCard)]);
  });

  it("does not write when URL CSV validation fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response('"","back","","key"'));
    const { result } = renderHook(useTestDeckImport);

    await expect(result.current.importUrl("https://example.test/invalid.csv")).rejects.toThrow("Fix invalid CSV rows");

    expect(mocks.createDeck).not.toHaveBeenCalled();
    expect(mocks.bulkUpsert).not.toHaveBeenCalled();
  });

  it("rejects a second import while the first is pending", async () => {
    let finish!: () => void;
    mocks.bulkUpsert.mockReturnValueOnce(new Promise<void>((resolve) => (finish = resolve)));
    const { result } = renderHook(useTestDeckImport);
    const file = new File(['"front","back","","key"'], "deck.csv", { type: "text/csv" });

    await actAsync(async () => {
      await result.current.selectFile(file);
    });

    let first: Promise<DeckImportResult> | undefined;
    act(() => {
      first = result.current.importPreview();
    });
    await waitFor(() => expect(result.current.pending).toBe(true));
    await expect(result.current.importPreview()).rejects.toThrow("already running");
    await actAsync(async () => {
      finish();
      await first;
    });
    expect(result.current.pending).toBe(false);
  });

  it("retains successful and failed counts after a partial Card write failure", async () => {
    mocks.bulkUpsert.mockRejectedValueOnce(new CardBulkMutationError(["card"], 1));
    const { result } = renderHook(useTestDeckImport);
    const file = new File(['"front","back","","key"'], "deck.csv", { type: "text/csv" });

    await actAsync(async () => {
      await result.current.selectFile(file);
    });
    await actAsync(async () => {
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

  it("retries only failed prepared Cards with stable IDs before listener publication", async () => {
    const deck = createDeck({ id: "destination", uid: "uid-a" });
    const first = {
      id: "prepared-first",
      deckId: deck.id,
      uid: deck.uid,
      frontText: "front-1",
      backText: "back-1",
      tags: [],
      uniqueKey: "first",
    } satisfies CardCreateInput;
    const second = {
      id: "prepared-second",
      deckId: deck.id,
      uid: deck.uid,
      frontText: "front-2",
      backText: "back-2",
      tags: [],
      uniqueKey: "second",
    } satisfies CardCreateInput;
    mocks.generateDeckId.mockReturnValueOnce(deck.id);
    mocks.generateCardId.mockReturnValueOnce(first.id).mockReturnValueOnce(second.id);
    mocks.bulkUpsert.mockRejectedValueOnce(new CardBulkMutationError([second.id], 2)).mockResolvedValueOnce(undefined);
    const { result } = renderHook(useTestDeckImport);
    const file = new File(['"front-1","back-1","","first"\n"front-2","back-2","","second"'], "deck.csv", {
      type: "text/csv",
    });

    await actAsync(async () => result.current.selectFile(file));
    await actAsync(async () => {
      await expect(result.current.importPreview()).rejects.toThrow("did not complete");
    });
    expect(result.current.partialResult).toEqual({
      created: 1,
      updated: 0,
      skipped: 0,
      failed: 1,
      deckId: deck.id,
    });

    act(() => result.current.retry());
    await waitFor(() =>
      expect(result.current.data).toEqual({
        created: 2,
        updated: 0,
        skipped: 0,
        failed: 0,
        deckId: deck.id,
      })
    );

    expect(mocks.decks).toEqual([]);
    expect(mocks.cards).toEqual([]);
    expect(mocks.createDeck).toHaveBeenCalledOnce();
    expect(mocks.bulkUpsert).toHaveBeenNthCalledWith(1, [first, second]);
    expect(mocks.bulkUpsert).toHaveBeenNthCalledWith(2, [second]);
  });

  it("clears operation data and error when a new file is selected", async () => {
    const { result } = renderHook(useTestDeckImport);
    const file = new File(['"front","back","","key"'], "deck.csv", { type: "text/csv" });
    await actAsync(async () => result.current.addSample());
    expect(result.current.data).toBeDefined();

    mocks.bulkUpsert.mockRejectedValueOnce(new Error("failed"));
    await actAsync(async () => {
      await expect(result.current.addSample()).rejects.toThrow("failed");
    });
    expect(result.current.error).toBeDefined();

    await actAsync(async () => result.current.selectFile(file));
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it("ignores completion from an old UID operation", async () => {
    let finishOld!: () => void;
    mocks.bulkUpsert.mockReturnValueOnce(new Promise<void>((resolve) => (finishOld = resolve)));
    const { result, rerender } = renderHook(useTestDeckImport);

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
    const { result, rerender } = renderHook(useTestDeckImport);

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
    let finishParse!: (analysis: Awaited<ReturnType<typeof mocks.parseCsv>>) => void;
    mocks.parseCsv.mockReturnValueOnce(
      new Promise((resolve) => {
        finishParse = resolve;
      })
    );
    const { result, rerender } = renderHook(useTestDeckImport);
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
    await actAsync(async () => {
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
    const { result, rerender } = renderHook(useTestDeckImport);
    await actAsync(async () => result.current.addSample());
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
    const { result, rerender } = renderHook(useTestDeckImport);

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
    await actAsync(async () => {
      finish();
      await operation;
    });
  });

  it("keeps successful import rows successful when authoritative recovery fails", async () => {
    mocks.generateCardId.mockReturnValueOnce("first").mockReturnValueOnce("second");
    mocks.bulkUpsert.mockRejectedValueOnce(
      new CardBulkMutationError(["second"], 2, { cause: new Error("authoritative read failed") })
    );
    const { result } = renderHook(useTestDeckImport);
    const file = new File(['"front-1","back-1","","first"\n"front-2","back-2","","second"'], "deck.csv", {
      type: "text/csv",
    });

    await actAsync(async () => result.current.selectFile(file));
    await actAsync(async () => {
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
