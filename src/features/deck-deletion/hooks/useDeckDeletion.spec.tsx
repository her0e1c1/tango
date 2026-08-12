import type { Deck } from "@/entities/deck";

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { actAsync } from "@/test/act";
import { createDeck as createDeckFixture } from "@/test/factories";

const createDeck = (overrides: Partial<Deck> = {}) => createDeckFixture({ uid: "uid-a", ...overrides });

const mocks = vi.hoisted(() => ({
  uid: "uid-a",
  deleteDeck: vi.fn(),
}));

vi.mock("@/entities/session", () => ({
  useSession: () =>
    mocks.uid === ""
      ? { status: "signedOut" }
      : { status: "authenticated", uid: mocks.uid, isAnonymous: true, displayName: null },
}));
vi.mock("../api/deleteDeck", () => ({ deleteDeck: mocks.deleteDeck }));

import { useDeckDeletion } from "./useDeckDeletion";

describe("useDeckDeletion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.uid = "uid-a";
    mocks.deleteDeck.mockResolvedValue(undefined);
  });

  it("exposes pending state and invokes success after server cleanup", async () => {
    let finish!: () => void;
    mocks.deleteDeck.mockReturnValueOnce(new Promise<void>((resolve) => (finish = resolve)));
    const deck = createDeck({ id: "deck" });
    const onRemoveSuccess = vi.fn();
    const { result } = renderHook(() => useDeckDeletion({ onRemoveSuccess }));

    let operation!: Promise<void>;
    act(() => {
      operation = result.current.remove(deck);
    });
    await waitFor(() => {
      expect(mocks.deleteDeck).toHaveBeenCalledExactlyOnceWith(deck.id);
      expect(result.current.isPending(deck.id)).toBe(true);
    });
    await actAsync(async () => {
      finish();
      await operation;
    });

    expect(onRemoveSuccess).toHaveBeenCalledExactlyOnceWith(deck);
    expect(result.current.pending).toBe(false);
  });

  it("retries a failed server cleanup", async () => {
    const deck = createDeck({ id: "deck" });
    const failure = new Error("remove failed");
    mocks.deleteDeck.mockRejectedValueOnce(failure).mockResolvedValueOnce(undefined);
    const onRemoveSuccess = vi.fn();
    const { result } = renderHook(() => useDeckDeletion({ onRemoveSuccess }));
    await actAsync(async () => {
      await expect(result.current.remove(deck)).rejects.toBe(failure);
    });

    act(() => result.current.retry());

    await waitFor(() => {
      expect(mocks.deleteDeck).toHaveBeenCalledTimes(2);
      expect(result.current.error).toBeNull();
      expect(onRemoveSuccess).toHaveBeenCalledExactlyOnceWith(deck);
    });
  });

  it("does not invoke success after unmounting", async () => {
    let finish!: () => void;
    mocks.deleteDeck.mockReturnValueOnce(new Promise<void>((resolve) => (finish = resolve)));
    const onRemoveSuccess = vi.fn();
    const { result, unmount } = renderHook(() => useDeckDeletion({ onRemoveSuccess }));

    act(() => void result.current.remove(createDeck({ id: "deck" })));
    await waitFor(() => expect(mocks.deleteDeck).toHaveBeenCalledTimes(1));
    unmount();
    finish();

    await waitFor(() => expect(onRemoveSuccess).not.toHaveBeenCalled());
  });

  it("rejects deletion without a confirmed owner", async () => {
    mocks.uid = "";
    const { result } = renderHook(useDeckDeletion);

    await actAsync(async () => {
      await expect(result.current.remove(createDeck())).rejects.toThrow("confirmed user");
    });

    expect(mocks.deleteDeck).not.toHaveBeenCalled();
  });

  it("does not invoke success after the authenticated user changes", async () => {
    let finish!: () => void;
    mocks.deleteDeck.mockReturnValueOnce(new Promise<void>((resolve) => (finish = resolve)));
    const onRemoveSuccess = vi.fn();
    const { result, rerender } = renderHook(() => useDeckDeletion({ onRemoveSuccess }));

    const operation = result.current.remove(createDeck({ id: "deck" }));
    await waitFor(() => expect(result.current.pending).toBe(true));
    mocks.uid = "uid-b";
    rerender();
    finish();
    await operation;

    expect(onRemoveSuccess).not.toHaveBeenCalled();
  });
});
