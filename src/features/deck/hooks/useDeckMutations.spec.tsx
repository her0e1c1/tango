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
vi.mock("@/adapters/firestore/deck", () => ({
  create: mocks.create,
  update: mocks.update,
  remove: mocks.remove,
}));

import { useDeckMutations } from "@/features/deck/hooks/useDeckMutations";

describe("useDeckMutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    remoteStore.getState().stop();
    mocks.uid = "uid-a";
    mocks.create.mockResolvedValue("deck-id");
    mocks.update.mockResolvedValue(undefined);
    mocks.remove.mockResolvedValue(undefined);
  });

  it("keeps mutation runners stable across an unchanged render", () => {
    const { result, rerender } = renderHook(useDeckMutations);
    const actions = result.current;

    rerender();

    expect(result.current.create).toBe(actions.create);
    expect(result.current.update).toBe(actions.update);
    expect(result.current.remove).toBe(actions.remove);
    expect(result.current.retry).toBe(actions.retry);
  });

  it("routes Deck creates and updates through the store", async () => {
    const deck = createDeck({ id: "deck", name: "Before" });
    const { result } = renderHook(useDeckMutations);

    await act(async () => result.current.create(deck));
    await act(async () => result.current.update({ ...deck, name: "After" }));

    expect(mocks.create).toHaveBeenCalledWith(deck);
    expect(mocks.update).toHaveBeenCalledWith({ ...deck, name: "After" });
    expect(remoteStore.getState().read.decksById).toEqual({});
  });

  it("exposes per-Deck pending state while an update is running", async () => {
    let finish!: () => void;
    mocks.update.mockReturnValueOnce(new Promise<void>((resolve) => (finish = resolve)));
    const deck = createDeck({ id: "deck" });
    const { result } = renderHook(useDeckMutations);

    let operation!: Promise<void>;
    act(() => {
      operation = result.current.update(deck);
    });

    await waitFor(() => {
      expect(result.current.pending).toBe(true);
      expect(result.current.isPending(deck.id)).toBe(true);
      expect(result.current.isPending("other")).toBe(false);
    });
    await act(async () => {
      finish();
      await operation;
    });
    expect(result.current.pending).toBe(false);
  });

  it("invokes remove success once when duplicate callers share one removal", async () => {
    let finish!: () => void;
    mocks.remove.mockReturnValueOnce(new Promise<void>((resolve) => (finish = resolve)));
    const deck = createDeck({ id: "deck" });
    const onRemoveSuccess = vi.fn();
    const { result } = renderHook(() => useDeckMutations({ onRemoveSuccess }));

    let first!: Promise<void>;
    let duplicate!: Promise<void>;
    act(() => {
      first = result.current.remove(deck);
      duplicate = result.current.remove(deck);
    });
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledExactlyOnceWith(deck.id, "uid-a"));
    await act(async () => {
      finish();
      await Promise.all([first, duplicate]);
    });

    expect(onRemoveSuccess).toHaveBeenCalledExactlyOnceWith(deck);
    expect(result.current.pending).toBe(false);
  });

  it("keeps a failed removal retry callback alive beyond the hook lifetime", async () => {
    const deck = createDeck({ id: "deck" });
    const failure = new Error("remove failed");
    let finishRetry!: () => void;
    mocks.remove
      .mockRejectedValueOnce(failure)
      .mockReturnValueOnce(new Promise<void>((resolve) => (finishRetry = resolve)));
    const onRemoveSuccess = vi.fn();
    const { result, unmount } = renderHook(() => useDeckMutations({ onRemoveSuccess }));
    await act(async () => {
      await expect(result.current.remove(deck)).rejects.toBe(failure);
    });

    act(() => result.current.retry());
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledTimes(2));
    unmount();
    finishRetry();

    await waitFor(() => expect(onRemoveSuccess).toHaveBeenCalledExactlyOnceWith(deck));
  });

  it("retries the latest failed update without invoking remove success", async () => {
    const deck = createDeck({ id: "deck" });
    const failure = new Error("update failed");
    mocks.update.mockRejectedValueOnce(failure).mockResolvedValueOnce(undefined);
    const onRemoveSuccess = vi.fn();
    const { result } = renderHook(() => useDeckMutations({ onRemoveSuccess }));

    await act(async () => {
      await expect(result.current.update(deck)).rejects.toBe(failure);
    });
    expect(result.current.error).toBe(failure);
    act(() => result.current.retry());

    await waitFor(() => {
      expect(mocks.update).toHaveBeenCalledTimes(2);
      expect(result.current.error).toBeNull();
    });
    expect(onRemoveSuccess).not.toHaveBeenCalled();
  });

  it("rejects writes without a confirmed user and exposes the error", async () => {
    mocks.uid = "";
    const { result } = renderHook(useDeckMutations);

    await act(async () => {
      await expect(result.current.create(createDeck())).rejects.toThrow("confirmed user");
    });

    expect(mocks.create).not.toHaveBeenCalled();
    expect(result.current.error).toEqual(
      expect.objectContaining({ message: expect.stringContaining("confirmed user") })
    );
  });

  it("does not expose or publish a stale removal after the authenticated UID changes", async () => {
    let finish!: () => void;
    mocks.remove.mockReturnValueOnce(new Promise<void>((resolve) => (finish = resolve)));
    const deck = createDeck({ id: "deck" });
    const onRemoveSuccess = vi.fn();
    const { result, rerender } = renderHook(() => useDeckMutations({ onRemoveSuccess }));

    let operation!: Promise<void>;
    act(() => {
      operation = result.current.remove(deck);
    });
    await waitFor(() => expect(result.current.pending).toBe(true));
    remoteStore.getState().stop();
    mocks.uid = "uid-b";
    rerender();
    finish();
    await operation;

    expect(result.current.pending).toBe(false);
    expect(result.current.error).toBeNull();
    expect(onRemoveSuccess).not.toHaveBeenCalled();
  });
});
