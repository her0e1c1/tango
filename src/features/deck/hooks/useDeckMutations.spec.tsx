import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDeck as createDeckFixture } from "@/test/factories";

const createDeck = (overrides: Partial<Deck> = {}) => createDeckFixture({ uid: "uid-a", ...overrides });

const mocks = vi.hoisted(() => ({
  uid: "uid-a",
  create: vi.fn(),
  update: vi.fn(),
  updateFilter: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("@/auth/AuthContext", () => ({
  useAuth: () =>
    mocks.uid === "" ? { status: "anonymous" } : { status: "authenticated", uid: mocks.uid, user: { uid: mocks.uid } },
}));
vi.mock("@/adapters/firestore/deck", () => ({
  create: mocks.create,
  update: mocks.update,
  updateFilter: mocks.updateFilter,
  remove: mocks.remove,
}));

import { useDeckMutations } from "@/features/deck/hooks/useDeckMutations";

describe("useDeckMutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.uid = "uid-a";
    mocks.create.mockResolvedValue("deck-id");
    mocks.update.mockResolvedValue(undefined);
    mocks.updateFilter.mockResolvedValue(undefined);
    mocks.remove.mockResolvedValue(undefined);
  });

  it("routes Deck creates, updates, and filter patches through commands", async () => {
    const deck = createDeck({ id: "deck", name: "Before" });
    const patch = { selectedTags: ["tag"], tagAndFilter: true, scoreMin: -1, scoreMax: 2 };
    const { result } = renderHook(useDeckMutations);

    await act(async () => result.current.create(deck));
    await act(async () => result.current.update({ ...deck, name: "After" }));
    await act(async () => result.current.updateFilter(deck.id, patch));

    expect(mocks.create).toHaveBeenCalledWith(deck);
    expect(mocks.update).toHaveBeenCalledWith({ ...deck, name: "After" });
    expect(mocks.updateFilter).toHaveBeenCalledWith(deck.id, patch);
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

  it("invokes remove success after the server-side removal completes", async () => {
    let finish!: () => void;
    mocks.remove.mockReturnValueOnce(new Promise<void>((resolve) => (finish = resolve)));
    const deck = createDeck({ id: "deck" });
    const onRemoveSuccess = vi.fn();
    const { result } = renderHook(() => useDeckMutations({ onRemoveSuccess }));

    let operation!: Promise<void>;
    act(() => {
      operation = result.current.remove(deck);
    });
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledExactlyOnceWith(deck.id));
    await act(async () => {
      finish();
      await operation;
    });

    expect(onRemoveSuccess).toHaveBeenCalledExactlyOnceWith(deck);
    expect(result.current.pending).toBe(false);
  });

  it("does not invoke a removal callback after the hook unmounts", async () => {
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

    await waitFor(() => expect(onRemoveSuccess).not.toHaveBeenCalled());
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

  it("replays lifecycle callbacks when retrying a failed update", async () => {
    const deck = createDeck({ id: "deck" });
    const failure = new Error("update failed");
    mocks.update.mockRejectedValueOnce(failure).mockResolvedValueOnce(undefined);
    const onMutate = vi.fn(() => "context");
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const { result } = renderHook(useDeckMutations);

    await act(async () => {
      await expect(result.current.update(deck, { onMutate, onSuccess, onError })).rejects.toBe(failure);
    });
    act(() => result.current.retry());

    await waitFor(() => expect(result.current.error).toBeNull());
    expect(onMutate).toHaveBeenCalledTimes(2);
    expect(onError).toHaveBeenCalledExactlyOnceWith(failure, "context");
    expect(onSuccess).toHaveBeenCalledExactlyOnceWith("context");
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

  it("does not invoke remove success for an operation started before the UID changes", async () => {
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
    mocks.uid = "uid-b";
    rerender();
    finish();
    await operation;

    expect(result.current.pending).toBe(false);
    expect(result.current.error).toBeNull();
    expect(onRemoveSuccess).not.toHaveBeenCalled();
  });
});
