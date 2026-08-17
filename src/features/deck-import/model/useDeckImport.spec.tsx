import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCards } from "@/entities/card";
import { useDecks } from "@/entities/deck";
import { actAsync } from "@/test/act";
import { createCard, createDeck } from "@/test/factories";

const controls = vi.hoisted(() => ({
  uid: "",
  remoteDecks: [] as Deck[],
  remoteCards: [] as Card[],
  remoteReadError: undefined as unknown,
  nextMutationError: undefined as unknown,
}));

vi.mock("@/entities/auth", () => ({ useAuthUid: () => controls.uid }));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/entities/card", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/card")>();
  return {
    ...actual,
    fetchCards: () => {
      if (controls.remoteReadError !== undefined) return Promise.reject(controls.remoteReadError);
      return Promise.resolve(controls.remoteCards);
    },
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
vi.mock("@/entities/deck", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/deck")>();
  return {
    ...actual,
    fetchDecks: () => {
      if (controls.remoteReadError !== undefined) return Promise.reject(controls.remoteReadError);
      return Promise.resolve(controls.remoteDecks);
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
    controls.remoteDecks = [];
    controls.remoteCards = [];
    controls.remoteReadError = undefined;
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
      plan: { created: 1, updated: 0, unchanged: 0 },
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

  it("updates a local Card and then skips an identical re-import", async () => {
    const name = "behavior-reimport.csv";
    const { result } = renderDeckImport();
    act(() => result.current.deckImport.setStorageMode("local"));

    await actAsync(async () => result.current.deckImport.selectFile(csvFile(name, "old back")));
    await actAsync(async () => result.current.deckImport.importPreview());
    const originalDeck = findDeck(result.current.decks, name);
    const originalCard = result.current.cards.find((card) => card.deckId === originalDeck?.id);

    await actAsync(async () => result.current.deckImport.selectFile(csvFile(name, "new back")));
    expect(result.current.deckImport.preview?.plan).toMatchObject({ created: 0, updated: 1, unchanged: 0 });
    await actAsync(async () => result.current.deckImport.importPreview());

    expect(result.current.decks.filter((deck) => deck.name === name)).toHaveLength(1);
    expect(result.current.cards.filter((card) => card.deckId === originalDeck?.id)).toEqual([
      expect.objectContaining({ id: originalCard?.id, backText: "new back" }),
    ]);

    await actAsync(async () => result.current.deckImport.selectFile(csvFile(name, "new back")));
    expect(result.current.deckImport.preview?.plan).toMatchObject({ created: 0, updated: 0, unchanged: 1 });
    await actAsync(async () => result.current.deckImport.importPreview());

    expect(result.current.deckImport.result).toMatchObject({ created: 0, updated: 0, skipped: 1 });
    expect(result.current.cards.filter((card) => card.deckId === originalDeck?.id)).toHaveLength(1);
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
    await actAsync(async () => {
      expect(await result.current.deckImport.importPreview()).toEqual({ status: "failure" });
    });
    expect(result.current.deckImport.previewError).toEqual(new Error("Fix invalid CSV rows before importing"));
    expect(findDeck(result.current.decks, name)).toBeUndefined();
  });

  it("clears a prepared preview when the destination changes", async () => {
    const { result } = renderDeckImport();
    act(() => result.current.deckImport.setStorageMode("local"));
    await actAsync(async () => result.current.deckImport.selectFile(csvFile("behavior-mode.csv")));

    act(() => result.current.deckImport.setStorageMode("remote"));

    expect(result.current.deckImport.storageMode).toBe("remote");
    expect(result.current.deckImport.preview).toBeUndefined();
    await actAsync(async () => {
      expect(await result.current.deckImport.importPreview()).toEqual({ status: "failure" });
    });
    expect(result.current.deckImport.previewError).toEqual(new Error("Select a CSV file before importing"));
  });

  it("builds a remote preview from current server data instead of stale local state", async () => {
    controls.uid = "uid-a";
    const serverDeck = createDeck({ id: "remote-preview-deck", name: "behavior-remote.csv", uid: controls.uid });
    controls.remoteDecks = [serverDeck];
    controls.remoteCards = [
      createCard({
        id: "remote-preview-card",
        deckId: serverDeck.id,
        uid: controls.uid,
        frontText: "front",
        backText: "old back",
        tags: ["tag"],
        uniqueKey: "key",
      }),
    ];
    const { result } = renderDeckImport();

    await actAsync(async () => result.current.deckImport.selectFile(csvFile("behavior-remote.csv", "new back")));

    expect(result.current.deckImport.preview?.plan).toMatchObject({ created: 0, updated: 1, unchanged: 0 });
    expect(findDeck(result.current.decks, "behavior-remote.csv")).toBeUndefined();
  });

  it("exposes a remote preview failure without changing stored data", async () => {
    controls.uid = "uid-a";
    controls.remoteReadError = new Error("server read failed");
    const name = "behavior-read-failure.csv";
    const { result } = renderDeckImport();

    await actAsync(async () => {
      expect(await result.current.deckImport.selectFile(csvFile(name))).toEqual({ status: "failure" });
    });

    expect(result.current.deckImport.fileName).toBe(name);
    expect(result.current.deckImport.preview).toBeUndefined();
    expect(result.current.deckImport.previewError).toEqual(new Error("server read failed"));
    expect(result.current.deckImport.error).toBeNull();
    expect(findDeck(result.current.decks, name)).toBeUndefined();
  });

  it("requires a fresh preview after a failed save and then completes the retry", async () => {
    const name = "behavior-retry.csv";
    const file = csvFile(name);
    const { result } = renderDeckImport();
    act(() => result.current.deckImport.setStorageMode("local"));
    await actAsync(async () => result.current.deckImport.selectFile(file));
    controls.nextMutationError = new Error("card mutation failed");

    await actAsync(async () => {
      expect(await result.current.deckImport.importPreview()).toEqual({ status: "failure" });
    });

    const savedDeck = findDeck(result.current.decks, name);
    expect(savedDeck).toBeDefined();
    expect(result.current.cards.filter((card) => card.deckId === savedDeck?.id)).toEqual([]);
    expect(result.current.deckImport.error).toEqual(new Error("card mutation failed"));
    await expect(result.current.deckImport.importPreview()).rejects.toThrow("prepared Deck import is not available");

    await actAsync(async () => result.current.deckImport.selectFile(file));
    expect(result.current.deckImport.error).toBeNull();
    expect(result.current.deckImport.preview?.plan).toMatchObject({ created: 1, updated: 0, unchanged: 0 });
    await actAsync(async () => result.current.deckImport.importPreview());

    expect(result.current.deckImport.result).toMatchObject({ created: 1, updated: 0, skipped: 0 });
    expect(result.current.cards.filter((card) => card.deckId === savedDeck?.id)).toHaveLength(1);
  });

  it("makes a sample preparation failure observable without rejecting", async () => {
    const { result } = renderDeckImport();

    await actAsync(async () => {
      expect(await result.current.deckImport.addSample()).toEqual({ status: "failure" });
    });

    expect(result.current.deckImport.error).toEqual(new Error("A confirmed user is required for remote imports"));
    expect(result.current.deckImport.pending).toBe(false);
  });
});
