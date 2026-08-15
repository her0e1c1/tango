/**
 * @file Verifies the "useDeckImport" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "previews a file without
 * writing until import is confirmed" and "keeps invalid files in preview without mutating state".
 */

import type { Card, CardMutation } from "@/entities/card";
import type { Deck, DeckCreateInput, DeckId } from "@/entities/deck";

import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCard, createDeck } from "@/test/factories";
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
        kind: "create",
        card: {
          id: "card",
          deckId: "deck",
          uid: "uid-a",
          frontText: "front",
          backText: "back",
          tags: [],
          uniqueKey: "key",
        },
      },
    ]);
    expect(imported).toEqual({ created: 1, updated: 0, skipped: 0, failed: 0, deckId: "deck" });
    expect(mocks.fetchDecks).toHaveBeenCalledOnce();
    expect(mocks.fetchCards).toHaveBeenCalledOnce();
  });

  it("does not mutate when server-backed preview reads fail", async () => {
    mocks.fetchDecks.mockRejectedValueOnce(new Error("server read failed"));
    const { result } = renderHook(useTestDeckImport);
    const file = new File(['"front","back","","key"'], "deck.csv", { type: "text/csv" });

    await actAsync(async () => {
      await expect(result.current.selectFile(file)).rejects.toThrow("server read failed");
    });

    expect(result.current.preview).toBeUndefined();
    expect(result.current.previewError).toEqual(new Error("server read failed"));
    expect(result.current.error).toBeNull();
    expect(mocks.createDeck).not.toHaveBeenCalled();
    expect(mocks.bulkUpsert).not.toHaveBeenCalled();
  });

  it("previews and executes the same server-backed plan when local state is stale", async () => {
    const serverDeck = createDeck({ id: "server-deck", name: "deck.csv", uid: "uid-a" });
    const serverCard = createCard({
      id: "server-card",
      deckId: serverDeck.id,
      uid: "uid-a",
      frontText: "front",
      backText: "old back",
      tags: [],
      uniqueKey: "key",
    });
    mocks.fetchDecks.mockResolvedValueOnce([serverDeck]);
    mocks.fetchCards.mockResolvedValueOnce([serverCard]);
    const { result } = renderHook(useTestDeckImport);
    const file = new File(['"front","new back","","key"'], "deck.csv", { type: "text/csv" });

    await actAsync(async () => result.current.selectFile(file));
    expect(result.current.preview?.plan).toMatchObject({ created: 0, updated: 1, unchanged: 0 });

    await actAsync(async () => result.current.importPreview());

    expect(mocks.createDeck).not.toHaveBeenCalled();
    expect(mocks.bulkUpsert).toHaveBeenCalledWith([
      { kind: "edit", card: expect.objectContaining({ id: "server-card", backText: "new back" }) },
    ]);
    expect(mocks.fetchDecks).toHaveBeenCalledOnce();
    expect(mocks.fetchCards).toHaveBeenCalledOnce();
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
    mocks.fetchDecks.mockResolvedValueOnce(mocks.decks);
    mocks.fetchCards.mockResolvedValueOnce(mocks.cards);
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
});
