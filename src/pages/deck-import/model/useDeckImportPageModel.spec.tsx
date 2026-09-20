import type { Deck } from "@/entities/deck";

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCards } from "@/entities/card";
import { useDecks, getDecks, deleteDeck } from "@/entities/deck";
import { updatePreferences, usePreferences } from "@/entities/preference";
import { actAsync } from "@/test/act";

const controls = vi.hoisted(() => ({
  uid: "",
  navigate: vi.fn(),
  remoteDeck: vi.fn(),
  remoteCard: vi.fn(),
  failAfterMutation: false,
  nextMutationError: undefined as unknown,
  nextMutationWait: undefined as Promise<void> | undefined,
  dismissToast: vi.fn(),
  showToast: vi.fn(),
}));

vi.mock("@/entities/auth", () => ({
  getAuthSession: () => (controls.uid ? { status: "authenticated", uid: controls.uid } : { status: "anonymous" }),
  getAuthUid: () => controls.uid ?? "",
}));
vi.mock("react-router-dom", () => ({ useNavigate: () => controls.navigate }));
vi.mock("@/entities/deck/api/firestore", () => ({ createDeck: controls.remoteDeck }));
vi.mock("@/entities/card/api/firestore", () => ({ createCard: controls.remoteCard }));
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
      await actual.mutateCards(...arguments_);
      if (controls.failAfterMutation) {
        controls.failAfterMutation = false;
        throw new Error("confirmation failed");
      }
    },
  };
});

import { useDeckImportPageModel } from "./useDeckImportPageModel";
import { deckImportStore } from "./store";
import { selectDeckImportFile } from "./actions/selectDeckImportFile";
import { importDeckPreview } from "./actions/importDeckPreview";
import { selectDeckImportExample } from "./actions/selectDeckImportExample";
import { deckImportExamples } from "../lib/examples";

const csvFile = (name: string, backText = "back") =>
  new File([`"front","${backText}","tag","key"`], name, { type: "text/csv" });

const renderDeckImport = () =>
  renderHook(() => {
    const model = useDeckImportPageModel();
    return {
      model,
      deckImport: {
        ...model.view,
        selectFile: selectDeckImportFile,
        setStorageMode: model.changeStorageMode,
        importPreview: importDeckPreview,
        selectExample: selectDeckImportExample,
      },
      decks: useDecks(),
      cards: useCards(),
      preferences: usePreferences(),
    };
  });

const findDeck = (decks: Deck[], name: string) => decks.find((deck) => deck.name === name);

describe("Deck import operations [IMPORT-01 IMPORT-02 IMPORT-03 IMPORT-04 IMPORT-05 IMPORT-06]", () => {
  beforeEach(async () => {
    await Promise.all(
      getDecks()
        .filter((deck) => deck.localMode)
        .map((deck) => deleteDeck("", deck.id))
    );
    deckImportStore.setState(deckImportStore.getInitialState(), true);
    controls.navigate.mockReset();
    controls.remoteDeck.mockReset();
    controls.remoteCard.mockReset();
    controls.failAfterMutation = false;
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
    expect(importResult).toBe(true);
    expect(result.current.deckImport.preview).toBeUndefined();
    expect(controls.showToast).toHaveBeenCalledTimes(1);
    expect(controls.showToast).toHaveBeenCalledWith({
      messageKey: "deckImport.toast.imported",
      messageParams: { count: 1 },
      tone: "success",
    });
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
      result.current.deckImport.selectFile(new File(["front,back,tag,"], name, { type: "text/csv" }))
    );

    expect(result.current.deckImport.preview).toMatchObject({
      analysis: {
        rows: [],
        invalidCount: 1,
        issues: [
          expect.objectContaining({
            rowNumber: 1,
            diagnostic: { kind: "card", field: "uniqueKey", reason: "required" },
          }),
        ],
      },
    });
    await expect(result.current.deckImport.importPreview()).resolves.toBe(false);
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
    act(() => result.current.model.changeStorageMode("local"));
    await actAsync(async () => selectDeckImportFile(csvFile("read-retry.csv")));
    expect(result.current.model.view.previewError).toBeUndefined();
    expect(result.current.model.view.preview?.deckName).toBe("read-retry.csv");
  });

  it("clears a prepared preview when the destination changes", async () => {
    const { result } = renderDeckImport();
    act(() => result.current.deckImport.setStorageMode("local"));
    await actAsync(async () => result.current.deckImport.selectFile(csvFile("behavior-mode.csv")));

    act(() => result.current.deckImport.setStorageMode("remote"));

    expect(result.current.deckImport.storageMode).toBe("remote");
    expect(result.current.deckImport.preview).toBeUndefined();
    await expect(result.current.deckImport.importPreview()).resolves.toBe(false);
  });

  it("retries a failed save with the same new Deck", async () => {
    const name = "behavior-retry.csv";
    const file = csvFile(name);
    const { result } = renderDeckImport();
    act(() => result.current.deckImport.setStorageMode("local"));
    await actAsync(async () => result.current.deckImport.selectFile(file));
    controls.nextMutationError = new Error("card mutation failed");

    await actAsync(async () => {
      await expect(result.current.deckImport.importPreview()).resolves.toBe(false);
    });

    const savedDeck = findDeck(result.current.decks, name);
    expect(savedDeck).toBeDefined();
    expect(result.current.cards.filter((card) => card.deckId === savedDeck?.id)).toEqual([]);
    expect(controls.showToast).toHaveBeenCalledWith({
      messageKey: "deckImport.toast.failure",
      tone: "error",
    });
    const retryResult = await actAsync(async () => result.current.deckImport.importPreview());

    expect(retryResult).toBe(true);
    expect(controls.dismissToast).not.toHaveBeenCalled();
    expect(controls.showToast).toHaveBeenLastCalledWith({
      messageKey: "deckImport.toast.imported",
      messageParams: { count: 1 },
      tone: "success",
    });
    expect(result.current.decks.filter((deck) => deck.name === name)).toHaveLength(1);
    expect(result.current.cards.filter((card) => card.deckId === savedDeck?.id)).toHaveLength(1);
  });

  it("shows an App-owned import failure that arrives after unmount", async () => {
    const request = Promise.withResolvers<void>();
    const { result, unmount } = renderDeckImport();
    act(() => result.current.deckImport.setStorageMode("local"));
    await actAsync(async () => result.current.deckImport.selectFile(csvFile("behavior-late-failure.csv")));
    controls.nextMutationWait = request.promise;
    controls.nextMutationError = new Error("late card mutation failure");
    let operation!: Promise<boolean>;

    act(() => {
      operation = result.current.deckImport.importPreview();
    });
    unmount();
    await actAsync(async () => {
      request.resolve();
      await operation;
    });

    expect(controls.showToast).toHaveBeenCalledExactlyOnceWith({
      messageKey: "deckImport.toast.failure",
      tone: "error",
    });
  });

  it("routes remote CSV writes to the current account without local persistence", async () => {
    controls.uid = "owner";
    const { result } = renderDeckImport();
    await actAsync(async () => selectDeckImportFile(csvFile("remote.csv")));
    expect(controls.remoteDeck).not.toHaveBeenCalled();
    expect(controls.remoteCard).not.toHaveBeenCalled();
    await actAsync(async () => expect(importDeckPreview()).resolves.toBe(true));
    expect(controls.remoteDeck).toHaveBeenCalledExactlyOnceWith(
      "owner",
      expect.objectContaining({ name: "remote.csv", localMode: false })
    );
    expect(controls.remoteCard).toHaveBeenCalledExactlyOnceWith(
      "owner",
      expect.objectContaining({ uid: "owner", frontText: "front", backText: "back" })
    );
    expect(result.current.decks.some((deck) => deck.name === "remote.csv")).toBe(false);
  });

  it("does not persist an empty CSV", async () => {
    const { result } = renderDeckImport();
    act(() => result.current.model.changeStorageMode("local"));
    await actAsync(async () => selectDeckImportFile(new File([""], "empty.csv")));
    expect(result.current.model.view.preview?.analysis.rows).toEqual([]);
    await expect(importDeckPreview()).resolves.toBe(false);
    expect(findDeck(result.current.decks, "empty.csv")).toBeUndefined();
  });

  it("preserves Card identities when retrying after writes were applied but confirmation failed", async () => {
    const { result } = renderDeckImport();
    act(() => result.current.model.changeStorageMode("local"));
    await actAsync(async () => selectDeckImportFile(csvFile("partial.csv")));
    controls.failAfterMutation = true;
    await actAsync(async () => expect(importDeckPreview()).resolves.toBe(false));
    const deck = findDeck(result.current.decks, "partial.csv");
    const cards = result.current.cards.filter((card) => card.deckId === deck?.id);
    expect(cards).toHaveLength(1);
    await actAsync(async () => expect(importDeckPreview()).resolves.toBe(true));
    expect(result.current.decks.filter((item) => item.name === "partial.csv")).toHaveLength(1);
    expect(result.current.cards.filter((card) => card.deckId === deck?.id).map((card) => card.id)).toEqual(
      cards.map((card) => card.id)
    );
  });

  it.each(["selection", "import"] as const)(
    "retains the shared busy state across re-entry during %s",
    async (workflow) => {
      const { result: firstResult, unmount: unmountFirst } = renderDeckImport();
      act(() => firstResult.current.model.changeStorageMode("local"));
      await actAsync(async () => selectDeckImportFile(csvFile("busy.csv")));
      const read = Promise.withResolvers<string>();
      const save = Promise.withResolvers<void>();
      const file = csvFile("pending.csv");
      vi.spyOn(file, "text").mockReturnValue(read.promise);
      if (workflow !== "selection") controls.nextMutationWait = save.promise;
      let operation!: Promise<unknown>;
      act(() => {
        operation = workflow === "selection" ? selectDeckImportFile(file) : importDeckPreview();
      });
      unmountFirst();
      const { result: secondResult } = renderDeckImport();
      const busy = workflow === "selection" ? "validating" : "pending";
      expect(secondResult.current.model.view[busy]).toBe(true);
      await actAsync(async () => {
        secondResult.current.model.changeStorageMode("remote");
        secondResult.current.model.chooseAgain();
        await selectDeckImportFile(csvFile("blocked.csv"));
        expect(await importDeckPreview()).toBe(false);
        await selectDeckImportExample("deck");
      });
      expect(secondResult.current.model.view.storageMode).toBe("local");
      expect(secondResult.current.model.view[busy]).toBe(true);
      expect(secondResult.current.model.view.preview?.deckName).toBe(workflow === "import" ? "busy.csv" : undefined);
      await actAsync(async () => {
        read.resolve("front,back,tag,key");
        save.resolve();
        await operation;
      });
      expect(secondResult.current.model.view[busy]).toBe(false);
      expect(findDeck(secondResult.current.decks, "blocked.csv")).toBeUndefined();
      expect(secondResult.current.model.view.preview?.deckName).toBe(workflow === "import" ? undefined : "pending.csv");
      expect(controls.showToast).toHaveBeenCalledTimes(workflow === "selection" ? 0 : 1);
    }
  );

  it.each(["importPreview"] as const)(
    "publishes %s success after unmount without redirecting the new Page",
    async (action) => {
      const { result: firstResult, unmount: unmountFirst } = renderDeckImport();
      act(() => firstResult.current.model.changeStorageMode("local"));
      await actAsync(async () => selectDeckImportFile(csvFile("late-success.csv")));
      const request = Promise.withResolvers<void>();
      controls.nextMutationWait = request.promise;
      act(() => firstResult.current.model[action]());
      unmountFirst();
      const { unmount: unmountSecond } = renderDeckImport();
      await actAsync(async () => {
        request.resolve();
        await request.promise;
      });
      await waitFor(() => expect(controls.showToast).toHaveBeenCalledTimes(1));
      expect(controls.showToast).toHaveBeenCalledWith(expect.objectContaining({ tone: "success" }));
      expect(controls.navigate).not.toHaveBeenCalled();
      unmountSecond();
      expect(controls.dismissToast).not.toHaveBeenCalled();
    }
  );

  it.each(["importPreview"] as const)("navigates on mounted %s success", async (action) => {
    const { result } = renderDeckImport();
    act(() => result.current.model.changeStorageMode("local"));
    act(() => result.current.model.selectFile(csvFile("navigate.csv")));
    await waitFor(() => expect(result.current.model.view.preview?.deckName).toBe("navigate.csv"));
    act(() => result.current.model[action]());
    await waitFor(() => expect(controls.navigate).toHaveBeenCalledExactlyOnceWith("/"));
  });

  it.each([false, true])(
    "discards selection when the account changes during a file read (failure: %s)",
    async (failure) => {
      controls.uid = "first";
      const { result } = renderDeckImport();
      const request = Promise.withResolvers<string>();
      const file = csvFile("changed-account.csv");
      vi.spyOn(file, "text").mockReturnValue(request.promise);
      let operation!: Promise<void>;
      act(() => {
        operation = selectDeckImportFile(file);
      });
      controls.uid = "second";
      await actAsync(async () => {
        if (failure) request.reject(new Error("read failed"));
        else request.resolve("front,back,tag,key");
        await operation;
      });
      expect(result.current.model.view).toMatchObject({
        validating: false,
        preview: undefined,
        previewError: undefined,
      });
      await expect(importDeckPreview()).resolves.toBe(false);
      expect(controls.remoteDeck).not.toHaveBeenCalled();
    }
  );

  it("refuses to save another account's prepared preview", async () => {
    controls.uid = "first";
    renderDeckImport();
    await actAsync(async () => selectDeckImportFile(csvFile("other-account.csv")));
    controls.uid = "second";
    await actAsync(async () => expect(importDeckPreview()).resolves.toBe(false));
    expect(controls.remoteDeck).not.toHaveBeenCalled();
    expect(controls.remoteCard).not.toHaveBeenCalled();
    expect(controls.showToast).toHaveBeenCalledExactlyOnceWith({
      messageKey: "deckImport.errors.accountChanged",
      tone: "error",
    });
  });

  it("preserves CSV preview on selecting the same storage mode", async () => {
    const { result } = renderDeckImport();
    act(() => result.current.model.changeStorageMode("local"));
    await actAsync(async () => selectDeckImportFile(csvFile("preserved.csv")));
    act(() => result.current.model.changeStorageMode("local"));
    expect(result.current.model.view.preview?.deckName).toBe("preserved.csv");
    await actAsync(async () => expect(importDeckPreview()).resolves.toBe(true));
    expect(findDeck(result.current.decks, "preserved.csv")).toBeDefined();
  });
  it.each(deckImportExamples)("reviews $id before saving locally", async (example) => {
    const { result } = renderDeckImport();
    act(() => result.current.model.changeStorageMode("local"));
    await actAsync(async () => selectDeckImportExample(example.id));
    expect(
      result.current.model.view.preview?.analysis.rows.map(({ card }) => ({
        frontText: card.frontText,
        backText: card.backText,
        tags: card.tags,
        uniqueKey: card.uniqueKey,
      }))
    ).toEqual(example.cards);
    expect(result.current.decks.some((item) => item.name === example.fileName)).toBe(false);
    await actAsync(async () => expect(importDeckPreview()).resolves.toBe(true));
    const deck = findDeck(result.current.decks, example.fileName);
    expect(deck?.localMode).toBe(true);
    expect(
      result.current.cards
        .filter((card) => card.deckId === deck?.id)
        .map(({ frontText, backText, tags, uniqueKey }) => ({ frontText, backText, tags, uniqueKey }))
    ).toEqual(example.cards);
    expect(controls.remoteDeck).not.toHaveBeenCalled();
    expect(controls.remoteCard).not.toHaveBeenCalled();
    expect(result.current.preferences.loadSample).toBe(true);
  });

  it.each(deckImportExamples)("reviews $id before saving remotely", async (example) => {
    controls.uid = "example-owner";
    const { result } = renderDeckImport();
    await actAsync(async () => selectDeckImportExample(example.id));
    expect(result.current.model.view.preview?.analysis.rows).toHaveLength(example.cards.length);
    expect(controls.remoteDeck).not.toHaveBeenCalled();
    expect(controls.remoteCard).not.toHaveBeenCalled();
    await actAsync(async () => expect(importDeckPreview()).resolves.toBe(true));
    expect(controls.remoteDeck).toHaveBeenCalledWith(
      "example-owner",
      expect.objectContaining({ name: example.fileName, localMode: false })
    );
    for (const card of example.cards)
      expect(controls.remoteCard).toHaveBeenCalledWith(
        "example-owner",
        expect.objectContaining({ ...card, uid: "example-owner" })
      );
    expect(result.current.decks.some((deck) => deck.name === example.fileName)).toBe(false);
    expect(result.current.preferences.loadSample).toBe(true);
  });

  it("selects another example before saving while retaining its destination", async () => {
    const { result } = renderDeckImport();
    act(() => result.current.model.changeStorageMode("local"));
    await actAsync(async () => selectDeckImportExample("deck"));
    act(() => result.current.model.chooseAgain());
    expect(result.current.model.view.preview).toBeUndefined();
    expect(result.current.model.view.storageMode).toBe("local");
    await actAsync(async () => selectDeckImportExample("math"));
    expect(result.current.model.view.preview?.deckName).toBe("math-sample.csv");
    expect(result.current.decks).toEqual([]);
    await actAsync(async () => expect(importDeckPreview()).resolves.toBe(true));
    expect(findDeck(result.current.decks, "math-sample.csv")?.localMode).toBe(true);
    expect(findDeck(result.current.decks, "deck-sample.csv")).toBeUndefined();
  });

  it("retries the reviewed sample deck without duplicating cards", async () => {
    const { result } = renderDeckImport();
    act(() => result.current.model.changeStorageMode("local"));
    await actAsync(async () => selectDeckImportExample("deck"));
    controls.failAfterMutation = true;
    await actAsync(async () => expect(importDeckPreview()).resolves.toBe(false));
    const deck = findDeck(result.current.decks, "deck-sample.csv");
    const importedCards = () =>
      result.current.cards
        .filter((card) => card.deckId === deck?.id)
        .map(({ id, frontText, backText, tags, uniqueKey }) => ({ id, frontText, backText, tags, uniqueKey }));
    const before = importedCards();
    expect(before.length).toBeGreaterThan(0);
    await actAsync(async () => expect(importDeckPreview()).resolves.toBe(true));
    expect(importedCards()).toEqual(before);
    await actAsync(async () => selectDeckImportExample("deck"));
    await actAsync(async () => expect(importDeckPreview()).resolves.toBe(true));
    expect(result.current.decks.filter((item) => item.name === "deck-sample.csv")).toHaveLength(2);
    expect(importedCards()).toEqual(before);
  });
});
