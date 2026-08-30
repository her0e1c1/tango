import type { Deck } from "@/entities/deck";

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCards } from "@/entities/card";
import { useDecks } from "@/entities/deck";
import { updatePreferences, usePreferences } from "@/entities/preference";
import { actAsync } from "@/test/act";

const controls = vi.hoisted(() => ({
  uid: "",
  nextMutationError: undefined as unknown,
  nextMutationWait: undefined as Promise<void> | undefined,
  dismissToast: vi.fn(),
  showToast: vi.fn(),
}));

vi.mock("@/entities/auth", () => ({ useAuthUid: () => controls.uid }));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/shared/ui/toast", () => ({ dismissToast: controls.dismissToast, showToast: controls.showToast }));
vi.mock("@/entities/card", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/card")>();
  return {
    ...actual,
    mutateCards: async (...arguments_: Parameters<typeof actual.mutateCards>) => {
      const wait = controls.nextMutationWait;
      controls.nextMutationWait = undefined;
      if (wait !== undefined) await wait;
      if (controls.nextMutationError !== undefined) {
        const error = controls.nextMutationError;
        controls.nextMutationError = undefined;
        throw error;
      }
      return actual.mutateCards(...arguments_);
    },
  };
});

import { useDeckImport } from "./useDeckImport";
import type { DeckImportResult } from "./useDeckImportExecution";

const csvFile = (name: string, backText = "back") =>
  new File([`"front","${backText}","tag","key"`], name, { type: "text/csv" });

const renderDeckImport = () =>
  renderHook(() => ({
    deckImport: useDeckImport(),
    decks: useDecks(),
    cards: useCards(),
    preferences: usePreferences(),
  }));

const findDeck = (decks: Deck[], name: string) => decks.find((deck) => deck.name === name);

describe("useDeckImport", () => {
  beforeEach(() => {
    controls.uid = "";
    controls.nextMutationError = undefined;
    controls.nextMutationWait = undefined;
    controls.dismissToast.mockReset();
    controls.showToast.mockReset();
    controls.showToast.mockReturnValue(1);
    updatePreferences({ loadSample: true });
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

    const importResult = await actAsync(async () => result.current.deckImport.importPreview());

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
    expect(importResult).toMatchObject({ created: 1 });
    expect(controls.showToast).toHaveBeenCalledWith({ message: "Imported 1 card.", tone: "success" });
  });

  it("creates a new local Deck without changing a same-name Deck or its Cards", async () => {
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
    await expect(result.current.deckImport.importPreview()).resolves.toBeUndefined();
    expect(findDeck(result.current.decks, name)).toBeUndefined();
  });

  it("exposes a file read failure without rejecting the UI operation", async () => {
    const { result } = renderDeckImport();
    const file = csvFile("unreadable.csv");
    vi.spyOn(file, "text").mockRejectedValue(new Error("file read failed"));

    await actAsync(async () => {
      await expect(result.current.deckImport.selectFile(file)).resolves.toBeUndefined();
    });

    expect(result.current.deckImport.previewError).toEqual(new Error("file read failed"));
  });

  it("clears a prepared preview when the destination changes", async () => {
    const { result } = renderDeckImport();
    act(() => result.current.deckImport.setStorageMode("local"));
    await actAsync(async () => result.current.deckImport.selectFile(csvFile("behavior-mode.csv")));

    act(() => result.current.deckImport.setStorageMode("remote"));

    expect(result.current.deckImport.storageMode).toBe("remote");
    expect(result.current.deckImport.preview).toBeUndefined();
    await expect(result.current.deckImport.importPreview()).resolves.toBeUndefined();
  });

  it("retries a failed save with the same new Deck", async () => {
    const name = "behavior-retry.csv";
    const file = csvFile(name);
    const { result } = renderDeckImport();
    act(() => result.current.deckImport.setStorageMode("local"));
    await actAsync(async () => result.current.deckImport.selectFile(file));
    controls.nextMutationError = new Error("card mutation failed");

    await actAsync(async () => {
      await expect(result.current.deckImport.importPreview()).resolves.toBeUndefined();
    });

    const savedDeck = findDeck(result.current.decks, name);
    expect(savedDeck).toBeDefined();
    expect(result.current.cards.filter((card) => card.deckId === savedDeck?.id)).toEqual([]);
    expect(controls.showToast).toHaveBeenCalledWith({
      message: "Import failed. card mutation failed",
      tone: "error",
    });
    const retryResult = await actAsync(async () => result.current.deckImport.importPreview());

    expect(retryResult).toMatchObject({ created: 1 });
    expect(controls.dismissToast).toHaveBeenCalledWith(1);
    expect(controls.showToast).toHaveBeenLastCalledWith({ message: "Imported 1 card.", tone: "success" });
    expect(result.current.decks.filter((deck) => deck.name === name)).toHaveLength(1);
    expect(result.current.cards.filter((card) => card.deckId === savedDeck?.id)).toHaveLength(1);
  });

  it("adds the sample to local storage and disables its automatic bootstrap", async () => {
    const { result } = renderDeckImport();

    const addResult = await actAsync(async () => result.current.deckImport.addSample());

    const sampleDeck = findDeck(result.current.decks, "Sample Deck");
    expect(sampleDeck).toMatchObject({ id: "sample-v1", localMode: true });
    expect(result.current.cards.filter((card) => card.deckId === sampleDeck?.id)).not.toEqual([]);
    expect(
      result.current.cards.filter((card) => card.deckId === sampleDeck?.id).every((card) => !("uid" in card))
    ).toBe(true);
    expect(result.current.preferences.loadSample).toBe(false);
    expect(controls.showToast).toHaveBeenCalledWith({
      message: `Added sample deck with ${String(addResult?.created)} cards.`,
      tone: "success",
    });
  });

  it("keeps the sample bootstrap enabled and dismisses its add failure on unmount", async () => {
    const { result, unmount } = renderDeckImport();
    controls.nextMutationError = new Error("sample mutation failed");

    await actAsync(async () => {
      await expect(result.current.deckImport.addSample()).resolves.toBeUndefined();
    });

    expect(controls.showToast).toHaveBeenCalledWith({
      message: "Unable to add sample deck. sample mutation failed",
      tone: "error",
    });
    expect(result.current.preferences.loadSample).toBe(true);

    unmount();
    expect(controls.dismissToast).toHaveBeenCalledWith(1);
  });

  it("does not show an import failure that arrives after unmount", async () => {
    const request = Promise.withResolvers<void>();
    const { result, unmount } = renderDeckImport();
    act(() => result.current.deckImport.setStorageMode("local"));
    await actAsync(async () => result.current.deckImport.selectFile(csvFile("behavior-late-failure.csv")));
    controls.nextMutationWait = request.promise;
    controls.nextMutationError = new Error("late card mutation failure");
    let operation!: Promise<DeckImportResult | undefined>;

    act(() => {
      operation = result.current.deckImport.importPreview();
    });
    unmount();
    await actAsync(async () => {
      request.resolve();
      await operation;
    });

    expect(controls.showToast).not.toHaveBeenCalled();
  });

  it("keeps repeated sample imports idempotent", async () => {
    const { result } = renderDeckImport();

    await actAsync(async () => result.current.deckImport.addSample());
    const firstCards = result.current.cards.filter((card) => card.deckId === "sample-v1");
    const firstCardIds = firstCards.map((card) => card.id);

    await actAsync(async () => result.current.deckImport.addSample());
    const repeatedCards = result.current.cards.filter((card) => card.deckId === "sample-v1");

    expect(repeatedCards).toHaveLength(firstCards.length);
    expect(repeatedCards.map((card) => card.id)).toEqual(firstCardIds);
  });
});
