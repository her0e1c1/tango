/**
 * @file Verifies URL imports, retries, concurrency, and partial-failure recovery for useDeckImport.
 */

import type { Card, CardMutation } from "@/entities/card";
import type { Deck, DeckCreateInput, DeckId } from "@/entities/deck";

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDeck } from "@/test/factories";
import { CardBulkMutationError } from "@/entities/card";
import type { DeckImportResult } from "../model/deckImportTypes";
import { actAsync } from "@/test/act";

type CardCreateInput = Extract<CardMutation, { kind: "create" }>["card"];

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

  it("uses the same CSV analysis pipeline for File and URL input", async () => {
    const csv = '"front","back"," foo,foo "," key "';
    const normalizedCard = { frontText: "front", backText: "back", tags: ["foo"], uniqueKey: "key" };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(csv));
    const { result } = renderHook(useTestDeckImport);

    await actAsync(async () => result.current.selectFile(new File([csv], "deck.csv")));
    expect(result.current.preview?.analysis.rows).toEqual([{ rowNumber: 1, card: normalizedCard }]);

    await actAsync(async () => result.current.importUrl("https://example.test/deck.csv"));
    expect(mocks.bulkUpsert).toHaveBeenLastCalledWith([
      { kind: "create", card: expect.objectContaining(normalizedCard) },
    ]);
  });

  it("does not write when URL CSV validation fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response('"","back","","key"'));
    const { result } = renderHook(useTestDeckImport);

    await expect(result.current.importUrl("https://example.test/invalid.csv")).rejects.toThrow("Fix invalid CSV rows");

    expect(mocks.createDeck).not.toHaveBeenCalled();
    expect(mocks.bulkUpsert).not.toHaveBeenCalled();
  });

  it("does not mutate when URL import server reads fail", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response('"front","back","","key"'));
    mocks.fetchCards.mockRejectedValueOnce(new Error("server read failed"));
    const { result } = renderHook(useTestDeckImport);

    await expect(result.current.importUrl("https://example.test/deck.csv")).rejects.toThrow("server read failed");

    expect(mocks.createDeck).not.toHaveBeenCalled();
    expect(mocks.bulkUpsert).not.toHaveBeenCalled();
  });

  it("retries server-backed preparation without fetching the URL again", async () => {
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response('"front","back","","key"'));
    mocks.fetchCards.mockRejectedValueOnce(new Error("server read failed")).mockResolvedValueOnce([]);
    const { result } = renderHook(useTestDeckImport);

    await actAsync(async () => {
      await expect(result.current.importUrl("https://example.test/deck.csv")).rejects.toThrow("server read failed");
    });
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.data).toMatchObject({ created: 1, failed: 0 }));

    expect(fetch).toHaveBeenCalledOnce();
    expect(mocks.fetchCards).toHaveBeenCalledTimes(2);
    expect(mocks.bulkUpsert).toHaveBeenCalledOnce();
  });

  it("rejects a second import while the first is pending", async () => {
    let finish!: () => void;
    mocks.bulkUpsert.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finish = resolve;
      })
    );
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
    expect(mocks.bulkUpsert).toHaveBeenNthCalledWith(1, [
      { kind: "create", card: first },
      { kind: "create", card: second },
    ]);
    expect(mocks.bulkUpsert).toHaveBeenNthCalledWith(2, [{ kind: "create", card: second }]);
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
    mocks.bulkUpsert.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishOld = resolve;
      })
    );
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
});
