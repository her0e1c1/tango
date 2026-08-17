import type { Deck } from "@/entities/deck";

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCards } from "@/entities/card";
import { useDecks } from "@/entities/deck";
import { actAsync } from "@/test/act";

const controls = vi.hoisted(() => ({
  uid: "",
  nextMutationError: undefined as unknown,
}));

vi.mock("@/entities/auth", () => ({ useAuthUid: () => controls.uid }));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/entities/card", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/card")>();
  return {
    ...actual,
    mutateCards: (...arguments_: Parameters<typeof actual.mutateCards>) => {
      if (controls.nextMutationError !== undefined) {
        const error = controls.nextMutationError;
        controls.nextMutationError = undefined;
        return Promise.reject(error);
      }
      return actual.mutateCards(...arguments_);
    },
  };
});

import { useDeckImport } from "./useDeckImport";

const csvFile = (name: string, backText = "back") =>
  new File([`"front","${backText}","tag","key"`], name, { type: "text/csv" });

const renderDeckImport = () =>
  renderHook(() => ({
    deckImport: useDeckImport(),
    decks: useDecks(),
    cards: useCards(),
  }));

const findDeck = (decks: Deck[], name: string) => decks.find((deck) => deck.name === name);

describe("useDeckImport", () => {
  beforeEach(() => {
    controls.uid = "";
    controls.nextMutationError = undefined;
  });

  it("previews a local CSV before saving its Deck and Cards", async () => {
    const name = "behavior-preview.csv";
    const { result } = renderDeckImport();

    act(() => result.current.deckImport.setStorageMode("local"));
    await actAsync(async () => result.current.deckImport.selectFile(csvFile(name)));

    expect(result.current.deckImport.preview).toMatchObject({
      deckName: name,
      analysis: { invalidCount: 0 },
    });
    expect(findDeck(result.current.decks, name)).toBeUndefined();

    await actAsync(async () => result.current.deckImport.importPreview());

    const savedDeck = findDeck(result.current.decks, name);
    expect(savedDeck).toMatchObject({ name, localMode: true });
    expect(result.current.cards.filter((card) => card.deckId === savedDeck?.id)).toEqual([
      expect.objectContaining({
        frontText: "front",
        backText: "back",
        tags: ["tag"],
        uniqueKey: "key",
      }),
    ]);
    expect(result.current.cards.find((card) => card.deckId === savedDeck?.id)).not.toHaveProperty("uid");
    expect(result.current.deckImport.result).toMatchObject({ created: 1, updated: 0, skipped: 0 });
  });

  it("creates a new local Deck instead of updating a same-name Deck", async () => {
    const name = "behavior-reimport.csv";
    const { result } = renderDeckImport();
    act(() => result.current.deckImport.setStorageMode("local"));

    await actAsync(async () => result.current.deckImport.selectFile(csvFile(name, "old back")));
    await actAsync(async () => result.current.deckImport.importPreview());
    const originalDeck = findDeck(result.current.decks, name);
    const originalCard = result.current.cards.find((card) => card.deckId === originalDeck?.id);

    await actAsync(async () => result.current.deckImport.selectFile(csvFile(name, "new back")));
    await actAsync(async () => result.current.deckImport.importPreview());

    const matchingDecks = result.current.decks.filter((deck) => deck.name === name);
    expect(matchingDecks).toHaveLength(2);
    expect(result.current.cards.filter((card) => card.deckId === originalDeck?.id)).toEqual([
      expect.objectContaining({ id: originalCard?.id, backText: "old back" }),
    ]);
    const newDeck = matchingDecks.find((deck) => deck.id !== originalDeck?.id);
    expect(result.current.cards.filter((card) => card.deckId === newDeck?.id)).toEqual([
      expect.objectContaining({ backText: "new back" }),
    ]);
  });

  it("keeps an invalid CSV in preview without creating a Deck", async () => {
    const name = "behavior-invalid.csv";
    const { result } = renderDeckImport();
    act(() => result.current.deckImport.setStorageMode("local"));

    await actAsync(async () =>
      result.current.deckImport.selectFile(new File(["front,back"], name, { type: "text/csv" }))
    );

    expect(result.current.deckImport.preview).toMatchObject({
      analysis: {
        rows: [],
        invalidCount: 1,
        issues: [expect.objectContaining({ rowNumber: 1, message: "Expected 4 columns, found 2." })],
      },
    });
    await expect(result.current.deckImport.importPreview()).rejects.toThrow("Fix invalid CSV rows");
    expect(findDeck(result.current.decks, name)).toBeUndefined();
  });

  it("clears a prepared preview when the destination changes", async () => {
    const { result } = renderDeckImport();
    act(() => result.current.deckImport.setStorageMode("local"));
    await actAsync(async () => result.current.deckImport.selectFile(csvFile("behavior-mode.csv")));

    act(() => result.current.deckImport.setStorageMode("remote"));

    expect(result.current.deckImport.storageMode).toBe("remote");
    expect(result.current.deckImport.preview).toBeUndefined();
    await expect(result.current.deckImport.importPreview()).rejects.toThrow("Select a CSV file");
  });

  it("requires a fresh preview after a failed save and then completes the retry", async () => {
    const name = "behavior-retry.csv";
    const file = csvFile(name);
    const { result } = renderDeckImport();
    act(() => result.current.deckImport.setStorageMode("local"));
    await actAsync(async () => result.current.deckImport.selectFile(file));
    controls.nextMutationError = new Error("card mutation failed");

    await actAsync(async () => {
      await expect(result.current.deckImport.importPreview()).rejects.toThrow("card mutation failed");
    });

    const savedDeck = findDeck(result.current.decks, name);
    expect(savedDeck).toBeDefined();
    expect(result.current.cards.filter((card) => card.deckId === savedDeck?.id)).toEqual([]);
    expect(result.current.deckImport.error).toEqual(new Error("card mutation failed"));
    await expect(result.current.deckImport.importPreview()).rejects.toThrow("prepared Deck import is not available");

    await actAsync(async () => result.current.deckImport.selectFile(file));
    expect(result.current.deckImport.error).toBeNull();
    await actAsync(async () => result.current.deckImport.importPreview());

    expect(result.current.deckImport.result).toMatchObject({ created: 1, updated: 0, skipped: 0 });
    expect(result.current.cards.filter((card) => card.deckId === savedDeck?.id)).toEqual([]);
    const retryDeck = result.current.decks.find((deck) => deck.name === name && deck.id !== savedDeck?.id);
    expect(retryDeck).toBeDefined();
    expect(result.current.cards.filter((card) => card.deckId === retryDeck?.id)).toHaveLength(1);
  });
});
