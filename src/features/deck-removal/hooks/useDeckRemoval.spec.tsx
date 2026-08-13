import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDeck } from "@/test/factories";
import { actAsync } from "@/test/act";

const mocks = vi.hoisted(() => ({ uid: "uid-a", removeDeck: vi.fn() }));

vi.mock("@/entities/session", () => ({
  useSession: () =>
    mocks.uid === ""
      ? { status: "signedOut" }
      : { status: "authenticated", uid: mocks.uid, isAnonymous: true, displayName: null },
}));
vi.mock("../model/removeDeck", () => ({ removeDeck: mocks.removeDeck }));

import { useDeckRemoval } from "./useDeckRemoval";

describe("useDeckRemoval", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.uid = "uid-a";
    mocks.removeDeck.mockResolvedValue(undefined);
  });

  it("exposes pending state and invokes success after removal", async () => {
    let finish!: () => void;
    mocks.removeDeck.mockReturnValueOnce(new Promise<void>((resolve) => (finish = resolve)));
    const deck = createDeck({ id: "deck", uid: mocks.uid });
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useDeckRemoval({ onSuccess }));

    let operation!: Promise<void>;
    act(() => {
      operation = result.current.remove(deck);
    });
    await waitFor(() => expect(result.current.isPending(deck.id)).toBe(true));
    finish();
    await actAsync(() => operation);

    expect(onSuccess).toHaveBeenCalledExactlyOnceWith(deck);
    expect(result.current.pending).toBe(false);
  });

  it("retries a failed removal", async () => {
    const deck = createDeck({ uid: mocks.uid });
    const failure = new Error("remove failed");
    mocks.removeDeck.mockRejectedValueOnce(failure).mockResolvedValueOnce(undefined);
    const { result } = renderHook(useDeckRemoval);

    await actAsync(async () => {
      await expect(result.current.remove(deck)).rejects.toBe(failure);
    });
    act(() => result.current.retry());

    await waitFor(() => {
      expect(mocks.removeDeck).toHaveBeenCalledTimes(2);
      expect(result.current.error).toBeNull();
    });
  });

  it("does not invoke success after the authenticated user changes", async () => {
    let finish!: () => void;
    mocks.removeDeck.mockReturnValueOnce(new Promise<void>((resolve) => (finish = resolve)));
    const deck = createDeck({ uid: mocks.uid });
    const onSuccess = vi.fn();
    const { result, rerender } = renderHook(() => useDeckRemoval({ onSuccess }));

    let operation!: Promise<void>;
    act(() => {
      operation = result.current.remove(deck);
    });
    await waitFor(() => expect(result.current.pending).toBe(true));
    mocks.uid = "uid-b";
    rerender();
    finish();
    await operation;

    expect(onSuccess).not.toHaveBeenCalled();
  });
});
