/**
 * @file Verifies that useDeckImport isolates asynchronous work across authentication changes.
 */

import type { Card, CardMutation } from "@/entities/card";
import type { Deck, DeckCreateInput, DeckId } from "@/entities/deck";

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CardBulkMutationError } from "@/entities/card";
import type { DeckImportResult } from "../model/deckImportTypes";
import { actAsync } from "@/test/act";

const mocks = vi.hoisted(() => ({
  uid: "uid-a",
  decks: [] as Deck[],
  cards: [] as Card[],
  parseCsv: vi.fn(),
  generateDeckId: vi.fn(() => "deck"),
  generateCardId: vi.fn(() => "card"),
  createDeck: vi.fn(),
  bulkUpsert: vi.fn(),
  fetchDecks: vi.fn(),
  fetchCards: vi.fn(),
}));

vi.mock("@/entities/auth", () => ({
  useAuthUid: () => mocks.uid,
}));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/entities/card", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/card")>();
  return {
    ...actual,
    filterCardsByDeckId: (cards: Card[], id: DeckId) => cards.filter((card) => card.deckId === id),
    fetchCards: mocks.fetchCards,
    mutateCards: (_uid: string, mutations: CardMutation[]) => mocks.bulkUpsert(mutations),
  };
});
vi.mock("@/entities/deck", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/deck")>();
  return {
    ...actual,
    generateDeckId: mocks.generateDeckId,
    fetchDecks: mocks.fetchDecks,
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
    createDeck: (_uid: string, deck: DeckCreateInput) => mocks.createDeck(deck),
    decks: mocks.decks,
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
    mocks.createDeck.mockResolvedValue(undefined);
    mocks.bulkUpsert.mockResolvedValue(undefined);
    mocks.fetchDecks.mockResolvedValue([]);
    mocks.fetchCards.mockResolvedValue([]);
  });

  it("does not write a slow URL import after the initiating UID changes", async () => {
    let finishFetch!: (response: Response) => void;
    vi.spyOn(globalThis, "fetch").mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        finishFetch = resolve;
      })
    );
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

  it("does not write when the UID changes during server-backed preparation", async () => {
    let finishServerRead!: (decks: Deck[]) => void;
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response('"front","back","","key"'));
    mocks.fetchDecks.mockReturnValueOnce(
      new Promise<Deck[]>((resolve) => {
        finishServerRead = resolve;
      })
    );
    const { result, rerender } = renderHook(useTestDeckImport);

    const operation = result.current.importUrl("https://example.test/deck.csv");
    const rejection = expect(operation).rejects.toThrow("user changed");
    await waitFor(() => expect(mocks.fetchDecks).toHaveBeenCalledWith("uid-a"));

    mocks.uid = "uid-b";
    rerender();
    finishServerRead([]);

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
    mocks.bulkUpsert.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finish = resolve;
      })
    );
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
