import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { firestoreKeys } from "@/query/firestoreKeys";
import { createQueryWrapper, createTestQueryClient } from "@/query/testUtils";
import { createDeck } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("@/auth/AuthContext", () => ({
  useAuth: () => ({ status: "authenticated", uid: "uid-a", user: { uid: "uid-a" } }),
}));
vi.mock("@/action/firestore", () => ({
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
    mocks.create.mockResolvedValue("deck-id");
    mocks.update.mockResolvedValue(undefined);
    mocks.remove.mockResolvedValue(undefined);
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
    const client = createTestQueryClient();
    client.setQueryData(firestoreKeys.decks("uid-a"), { [deck.id]: deck, [otherDeck.id]: otherDeck });
    const { result } = renderHook(useDeckMutations, { wrapper: createQueryWrapper(client) });
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

  it("keeps a failed removal available for a safe retry", async () => {
    const deck = createDeck({ id: "deck-a" });
    const error = new Error("delete failed");
    mocks.remove.mockRejectedValueOnce(error).mockResolvedValueOnce(undefined);
    const client = createTestQueryClient();
    client.setQueryData(firestoreKeys.decks("uid-a"), { [deck.id]: deck });
    const { result } = renderHook(useDeckMutations, { wrapper: createQueryWrapper(client) });

    await act(async () => {
      await expect(result.current.remove(deck)).rejects.toThrow(error);
    });

    await waitFor(() => expect(result.current.error).toBe(error));
    act(() => result.current.retry());
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledTimes(2));
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
    const client = createTestQueryClient();
    client.setQueryData(firestoreKeys.decks("uid-a"), { [deck.id]: deck });
    const { result, unmount } = renderHook(() => useDeckMutations({ onRemoveSuccess }), {
      wrapper: createQueryWrapper(client),
    });

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
    const client = createTestQueryClient();
    client.setQueryData(firestoreKeys.decks("uid-a"), { [deck.id]: deck });
    const { result } = renderHook(useDeckMutations, { wrapper: createQueryWrapper(client) });

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
    const client = createTestQueryClient();
    client.setQueryData(firestoreKeys.decks("uid-a"), {
      [failedDeck.id]: failedDeck,
      [successfulDeck.id]: successfulDeck,
    });
    const { result } = renderHook(useDeckMutations, { wrapper: createQueryWrapper(client) });
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
    const client = createTestQueryClient();
    client.setQueryData(firestoreKeys.decks("uid-a"), { [firstDeck.id]: firstDeck, [laterDeck.id]: laterDeck });
    const { result } = renderHook(useDeckMutations, { wrapper: createQueryWrapper(client) });
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
});
