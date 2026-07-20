/**
 * @file Verifies the "useDeckMutations" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "shares one in-flight
 * removal for the same Deck", "keeps a failed removal available for a safe retry", "runs remove
 * success cleanup after a retry finishes beyond the hook lifetime".
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { remoteStore } from "@/store/remoteStore";
import { createDeck } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  uid: "uid-a",
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("@/auth/AuthContext", () => ({
  useAuth: () =>
    mocks.uid === "" ? { status: "anonymous" } : { status: "authenticated", uid: mocks.uid, user: { uid: mocks.uid } },
}));
vi.mock("@/adapters/firestore", () => ({
  deck: {
    create: mocks.create,
    update: mocks.update,
    remove: mocks.remove,
  },
}));

import { useDeckMutations } from "@/features/deck/hooks/useDeckMutations";

describe("useDeckMutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.uid = "uid-a";
    remoteStore.clear();
    remoteStore.begin("uid-a");
    mocks.create.mockResolvedValue("deck-id");
    mocks.update.mockResolvedValue(undefined);
    mocks.remove.mockResolvedValue(undefined);
  });

  it("publishes a created Deck only after the listener responds", async () => {
    const deck = createDeck({ id: "created" });
    const { result } = renderHook(useDeckMutations);

    await act(async () => result.current.create(deck));

    expect(mocks.create).toHaveBeenCalledWith(deck);
    expect(remoteStore.getSnapshot().decksById).toEqual({});

    remoteStore.applySnapshot("uid-a", "decks", {
      data: { [deck.id]: deck },
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    expect(remoteStore.getSnapshot().decksById).toEqual({ [deck.id]: deck });
  });

  it("publishes an updated Deck only after the listener responds", async () => {
    const deck = createDeck({ id: "deck-a", name: "Before" });
    remoteStore.applySnapshot("uid-a", "decks", {
      data: { [deck.id]: deck },
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    const { result } = renderHook(useDeckMutations);
    const updated = { ...deck, name: "After" };

    await act(async () => result.current.update(updated));

    expect(mocks.update).toHaveBeenCalledWith(updated);
    expect(remoteStore.getSnapshot().decksById).toEqual({ [deck.id]: deck });

    remoteStore.applySnapshot("uid-a", "decks", {
      data: { [updated.id]: updated },
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    expect(remoteStore.getSnapshot().decksById).toEqual({ [updated.id]: updated });
  });

  it("removes a Deck from remote data only after the listener responds", async () => {
    const deck = createDeck({ id: "removed" });
    remoteStore.applySnapshot("uid-a", "decks", {
      data: { [deck.id]: deck },
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    const { result } = renderHook(useDeckMutations);

    await act(async () => result.current.remove(deck));

    expect(mocks.remove).toHaveBeenCalledWith(deck.id, "uid-a");
    expect(remoteStore.getSnapshot().decksById).toEqual({ [deck.id]: deck });

    remoteStore.applySnapshot("uid-a", "decks", {
      data: {},
      metadata: { size: 0, fromCache: false, hasPendingWrites: false },
    });
    expect(remoteStore.getSnapshot().decksById).toEqual({});
  });

  it("does not publish an old UID failure into the current UID", async () => {
    const deck = createDeck({ id: "deck-a" });
    let rejectOld!: (error: Error) => void;
    mocks.update.mockReturnValueOnce(new Promise<void>((_resolve, reject) => (rejectOld = reject)));
    const { result, rerender } = renderHook(useDeckMutations);

    let operation!: Promise<void>;
    act(() => {
      operation = result.current.update(deck);
    });
    await waitFor(() => expect(result.current.pending).toBe(true));
    mocks.uid = "uid-b";
    rerender();
    await waitFor(() => expect(result.current.pending).toBe(false));

    rejectOld(new Error("old failure"));
    await expect(operation).rejects.toThrow("old failure");
    expect(result.current.error).toBeNull();
    expect(result.current.pending).toBe(false);
  });

  it("leaves remote Deck data unchanged after a failed update and its retry", async () => {
    const deck = createDeck({ id: "failed-update", name: "Before" });
    const updated = { ...deck, name: "After" };
    const error = new Error("update failed");
    mocks.update.mockRejectedValueOnce(error);
    remoteStore.applySnapshot("uid-a", "decks", {
      data: { [deck.id]: deck },
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    const { result } = renderHook(useDeckMutations);

    await act(async () => {
      await expect(result.current.update(updated)).rejects.toBe(error);
    });

    expect(result.current.error).toBe(error);
    expect(remoteStore.getSnapshot().decksById).toEqual({ [deck.id]: deck });
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.error).toBeNull());
    expect(mocks.update).toHaveBeenCalledTimes(2);
    expect(remoteStore.getSnapshot().decksById).toEqual({ [deck.id]: deck });
  });

  it("shares one in-flight removal for the same Deck", async () => {
    let finishRemove: () => void = () => undefined;
    mocks.remove.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishRemove = resolve;
        })
    );
    const deck = createDeck({ id: "deck-a" });
    const otherDeck = createDeck({ id: "deck-b" });
    remoteStore.applySnapshot("uid-a", "decks", {
      data: { [deck.id]: deck, [otherDeck.id]: otherDeck },
      metadata: { size: 2, fromCache: false, hasPendingWrites: false },
    });
    const { result } = renderHook(useDeckMutations);
    let firstRemove: Promise<void> | undefined;
    let secondRemove: Promise<void> | undefined;

    act(() => {
      firstRemove = result.current.remove(deck);
      secondRemove = result.current.remove(deck);
    });

    try {
      await waitFor(() => {
        expect(mocks.remove).toHaveBeenCalledExactlyOnceWith(deck.id, "uid-a");
        expect(result.current.pending).toBe(true);
        expect(result.current.isPending(deck.id)).toBe(true);
        expect(result.current.isPending(otherDeck.id)).toBe(false);
      });
      expect(secondRemove).toBe(firstRemove);
    } finally {
      await act(async () => {
        finishRemove();
        await firstRemove;
      });
    }

    expect(result.current.pending).toBe(false);
    expect(result.current.isPending(deck.id)).toBe(false);
  });

  it("serializes distinct updates for the same Deck and stays pending until both settle", async () => {
    const deck = createDeck({ id: "deck-a", name: "Before" });
    let finishFirst!: () => void;
    let finishSecond!: () => void;
    mocks.update
      .mockReturnValueOnce(new Promise<void>((resolve) => (finishFirst = resolve)))
      .mockReturnValueOnce(new Promise<void>((resolve) => (finishSecond = resolve)));
    const { result } = renderHook(useDeckMutations);

    let first!: Promise<void>;
    let second!: Promise<void>;
    act(() => {
      first = result.current.update({ ...deck, name: "First" });
      second = result.current.update({ ...deck, name: "Second" });
    });
    await waitFor(() => expect(mocks.update).toHaveBeenCalledExactlyOnceWith({ ...deck, name: "First" }));

    await act(async () => {
      finishFirst();
      await first;
    });
    await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(2));
    expect(mocks.update).toHaveBeenLastCalledWith({ ...deck, name: "Second" });
    expect(result.current.isPending(deck.id)).toBe(true);

    await act(async () => {
      finishSecond();
      await second;
    });
    expect(result.current.isPending(deck.id)).toBe(false);
  });

  it("clears an older queued Deck failure after a newer same-Deck update succeeds", async () => {
    const deck = createDeck({ id: "deck-a", name: "Before" });
    const firstUpdate = { ...deck, name: "First" };
    const secondUpdate = { ...deck, name: "Second" };
    const error = new Error("first update failed");
    let rejectFirst!: (error: Error) => void;
    mocks.update
      .mockReturnValueOnce(new Promise<void>((_resolve, reject) => (rejectFirst = reject)))
      .mockResolvedValueOnce(undefined);
    const { result } = renderHook(useDeckMutations);

    let firstOperation!: Promise<void>;
    let secondOperation!: Promise<void>;
    act(() => {
      firstOperation = result.current.update(firstUpdate);
      secondOperation = result.current.update(secondUpdate);
    });
    await waitFor(() => expect(mocks.update).toHaveBeenCalledExactlyOnceWith(firstUpdate));

    await act(async () => {
      rejectFirst(error);
      await expect(firstOperation).rejects.toBe(error);
    });
    await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(2));
    await act(async () => secondOperation);

    expect(result.current.error).toBeNull();
    act(() => result.current.retry());
    await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(2));
  });

  it("serializes a same-Deck removal after an update", async () => {
    const deck = createDeck({ id: "deck-a" });
    let finishUpdate!: () => void;
    mocks.update.mockReturnValueOnce(new Promise<void>((resolve) => (finishUpdate = resolve)));
    remoteStore.applySnapshot("uid-a", "decks", {
      data: { [deck.id]: deck },
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    const { result } = renderHook(useDeckMutations);

    let update!: Promise<void>;
    let remove!: Promise<void>;
    act(() => {
      update = result.current.update({ ...deck, name: "Updated" });
      remove = result.current.remove(deck);
    });
    await waitFor(() => expect(mocks.update).toHaveBeenCalledOnce());
    expect(mocks.remove).not.toHaveBeenCalled();

    await act(async () => {
      finishUpdate();
      await update;
    });
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledExactlyOnceWith(deck.id, "uid-a"));
    await remove;
    expect(result.current.isPending(deck.id)).toBe(false);
  });

  it("keeps a failed removal available for a safe retry", async () => {
    const deck = createDeck({ id: "deck-a" });
    const error = new Error("delete failed");
    mocks.remove.mockRejectedValueOnce(error).mockResolvedValueOnce(undefined);
    remoteStore.applySnapshot("uid-a", "decks", {
      data: { [deck.id]: deck },
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    const { result } = renderHook(useDeckMutations);

    await act(async () => {
      await expect(result.current.remove(deck)).rejects.toThrow(error);
    });

    await waitFor(() => expect(result.current.error).toBe(error));
    expect(remoteStore.getSnapshot().decksById).toEqual({ [deck.id]: deck });
    act(() => result.current.retry());
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledTimes(2));
    expect(remoteStore.getSnapshot().decksById).toEqual({ [deck.id]: deck });
  });

  it("runs remove success cleanup after a retry finishes beyond the hook lifetime", async () => {
    const deck = createDeck({ id: "deck-a" });
    const error = new Error("delete failed");
    let finishRetry: () => void = () => undefined;
    const retryRequest = new Promise<void>((resolve) => {
      finishRetry = resolve;
    });
    mocks.remove.mockRejectedValueOnce(error).mockReturnValueOnce(retryRequest);
    const onRemoveSuccess = vi.fn();
    remoteStore.applySnapshot("uid-a", "decks", {
      data: { [deck.id]: deck },
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    const { result, unmount } = renderHook(() => useDeckMutations({ onRemoveSuccess }));

    await act(async () => {
      await expect(result.current.remove(deck)).rejects.toBe(error);
    });
    expect(onRemoveSuccess).not.toHaveBeenCalled();

    act(() => result.current.retry());
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledTimes(2));
    unmount();
    finishRetry();

    await waitFor(() => expect(onRemoveSuccess).toHaveBeenCalledExactlyOnceWith(deck));
  });

  it("clears a failed removal after the same Deck is removed manually", async () => {
    const deck = createDeck({ id: "deck-a" });
    const error = new Error("delete failed");
    mocks.remove.mockRejectedValueOnce(error).mockResolvedValue(undefined);
    remoteStore.applySnapshot("uid-a", "decks", {
      data: { [deck.id]: deck },
      metadata: { size: 1, fromCache: false, hasPendingWrites: false },
    });
    const { result } = renderHook(useDeckMutations);

    await act(async () => {
      await expect(result.current.remove(deck)).rejects.toThrow(error);
    });
    await waitFor(() => expect(result.current.error).toBe(error));

    await act(async () => result.current.remove(deck));

    expect(result.current.error).toBeNull();
    act(() => result.current.retry());
    expect(result.current.pending).toBe(false);
    expect(mocks.remove).toHaveBeenCalledTimes(2);
  });

  it("keeps a Deck failure after an unrelated Deck succeeds until its retry succeeds", async () => {
    const failedDeck = createDeck({ id: "deck-a" });
    const successfulDeck = createDeck({ id: "deck-b" });
    const error = new Error("deck-a failed");
    let rejectFailedDeck: (error: Error) => void = () => undefined;
    let finishSuccessfulDeck: () => void = () => undefined;
    let failedDeckAttempts = 0;
    mocks.remove.mockImplementation((id: DeckId) => {
      if (id === failedDeck.id && ++failedDeckAttempts === 1) {
        return new Promise<void>((_resolve, reject) => {
          rejectFailedDeck = reject;
        });
      }
      if (id === successfulDeck.id) {
        return new Promise<void>((resolve) => {
          finishSuccessfulDeck = resolve;
        });
      }
      return Promise.resolve();
    });
    remoteStore.applySnapshot("uid-a", "decks", {
      data: {
        [failedDeck.id]: failedDeck,
        [successfulDeck.id]: successfulDeck,
      },
      metadata: { size: 2, fromCache: false, hasPendingWrites: false },
    });
    const { result } = renderHook(useDeckMutations);
    let failedRemoval: Promise<void> | undefined;
    let successfulRemoval: Promise<void> | undefined;

    act(() => {
      failedRemoval = result.current.remove(failedDeck);
      successfulRemoval = result.current.remove(successfulDeck);
    });
    await waitFor(() => {
      expect(mocks.remove).toHaveBeenCalledTimes(2);
      expect(result.current.pending).toBe(true);
      expect(result.current.isPending(failedDeck.id)).toBe(true);
      expect(result.current.isPending(successfulDeck.id)).toBe(true);
    });
    await act(async () => {
      rejectFailedDeck(error);
      await expect(failedRemoval).rejects.toThrow(error);
    });
    await waitFor(() => {
      expect(result.current.error).toBe(error);
      expect(result.current.pending).toBe(true);
      expect(result.current.isPending(failedDeck.id)).toBe(false);
      expect(result.current.isPending(successfulDeck.id)).toBe(true);
    });
    await act(async () => {
      finishSuccessfulDeck();
      await successfulRemoval;
    });

    expect(result.current.error).toBe(error);
    expect(result.current.pending).toBe(false);
    expect(result.current.isPending(failedDeck.id)).toBe(false);
    expect(result.current.isPending(successfulDeck.id)).toBe(false);
    act(() => result.current.retry());
    await waitFor(() => {
      expect(mocks.remove).toHaveBeenCalledTimes(3);
      expect(mocks.remove.mock.calls.filter(([id]) => id === failedDeck.id)).toHaveLength(2);
      expect(mocks.remove.mock.calls.filter(([id]) => id === successfulDeck.id)).toHaveLength(1);
      expect(result.current.error).toBeNull();
    });
  });

  it("retries the most recently settled Deck failure", async () => {
    const firstDeck = createDeck({ id: "deck-c" });
    const laterDeck = createDeck({ id: "deck-d" });
    const firstError = new Error("deck-c failed");
    const laterError = new Error("deck-d failed");
    const rejectById = new Map<DeckId, (error: Error) => void>();
    mocks.remove.mockImplementation((id: DeckId) => {
      if (rejectById.has(id)) return Promise.resolve();
      return new Promise<void>((_resolve, reject) => rejectById.set(id, reject));
    });
    remoteStore.applySnapshot("uid-a", "decks", {
      data: { [firstDeck.id]: firstDeck, [laterDeck.id]: laterDeck },
      metadata: { size: 2, fromCache: false, hasPendingWrites: false },
    });
    const { result } = renderHook(useDeckMutations);
    let firstRemoval: Promise<void> | undefined;
    let laterRemoval: Promise<void> | undefined;

    act(() => {
      firstRemoval = result.current.remove(firstDeck);
      laterRemoval = result.current.remove(laterDeck);
    });
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledTimes(2));
    await act(async () => {
      rejectById.get(firstDeck.id)?.(firstError);
      await expect(firstRemoval).rejects.toThrow(firstError);
    });
    await waitFor(() => expect(result.current.error).toBe(firstError));
    await act(async () => {
      rejectById.get(laterDeck.id)?.(laterError);
      await expect(laterRemoval).rejects.toThrow(laterError);
    });
    await waitFor(() => expect(result.current.error).toBe(laterError));

    act(() => result.current.retry());

    await waitFor(() => {
      expect(mocks.remove).toHaveBeenCalledTimes(3);
      expect(mocks.remove).toHaveBeenLastCalledWith(laterDeck.id, "uid-a");
      expect(result.current.error).toBeNull();
    });
  });

  it("does not resurrect Deck state after an A-to-B-to-A UID transition", async () => {
    const deck = createDeck({ id: "deck-a" });
    const error = new Error("failed");
    mocks.update.mockRejectedValueOnce(error);
    const { result, rerender } = renderHook(useDeckMutations);

    await act(async () => {
      await expect(result.current.update(deck)).rejects.toBe(error);
    });
    expect(result.current.error).toBe(error);
    mocks.uid = "uid-b";
    rerender();
    mocks.uid = "uid-a";
    rerender();

    expect(result.current.error).toBeNull();
    expect(result.current.pending).toBe(false);
  });

  it("queues a failed remove retry behind an unrelated same-Deck update", async () => {
    const deck = createDeck({ id: "deck-a" });
    const error = new Error("remove failed");
    let finishUpdate!: () => void;
    let finishRetry!: () => void;
    mocks.remove
      .mockRejectedValueOnce(error)
      .mockReturnValueOnce(new Promise<void>((resolve) => (finishRetry = resolve)));
    mocks.update.mockReturnValueOnce(new Promise<void>((resolve) => (finishUpdate = resolve)));
    const { result } = renderHook(useDeckMutations);

    await act(async () => {
      await expect(result.current.remove(deck)).rejects.toBe(error);
    });
    let update!: Promise<void>;
    act(() => {
      update = result.current.update(deck);
      result.current.retry();
    });
    expect(mocks.remove).toHaveBeenCalledOnce();
    expect(result.current.error).toBe(error);

    await act(async () => {
      finishUpdate();
      await update;
    });
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledTimes(2));
    expect(result.current.error).toBe(error);
    await act(async () => finishRetry());
    await waitFor(() => expect(result.current.error).toBeNull());
  });
});
