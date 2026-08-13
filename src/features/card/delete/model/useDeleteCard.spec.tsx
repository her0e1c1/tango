import type { Card } from "@/entities/card";

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { actAsync } from "@/test/act";
import { createCard as createCardFixture } from "@/test/factories";

const mocks = vi.hoisted(() => ({ uid: "uid-a", deleteCard: vi.fn() }));

vi.mock("@/entities/auth-session", () => ({
  useAuthSession: () =>
    mocks.uid === ""
      ? { status: "signedOut" }
      : { status: "authenticated", uid: mocks.uid, isAnonymous: true, displayName: null },
}));
vi.mock("../api/deleteCard", () => ({ deleteCard: mocks.deleteCard }));

import { useDeleteCard } from "./useDeleteCard";

const card = createCardFixture({ id: "card", uid: "uid-a" }) as Card;

describe("useDeleteCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.uid = "uid-a";
    mocks.deleteCard.mockResolvedValue(undefined);
  });

  it("reports a successful removal after retry", async () => {
    const onSuccess = vi.fn();
    mocks.deleteCard.mockRejectedValueOnce(new Error("remove failed")).mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useDeleteCard({ onSuccess }));
    await actAsync(async () => {
      await expect(result.current.remove(card)).rejects.toThrow("remove failed");
    });
    expect(onSuccess).not.toHaveBeenCalled();
    act(() => result.current.retry());
    await waitFor(() => expect(onSuccess).toHaveBeenCalledExactlyOnceWith(card));
  });

  it("suppresses a stale success after the authenticated UID changes", async () => {
    let finish!: () => void;
    const onSuccess = vi.fn();
    mocks.deleteCard.mockReturnValueOnce(new Promise<void>((resolve) => (finish = resolve)));
    const { result, rerender } = renderHook(() => useDeleteCard({ onSuccess }));
    let operation!: Promise<void>;
    act(() => {
      operation = result.current.remove(card);
    });
    await waitFor(() => expect(result.current.pending).toBe(true));
    mocks.uid = "uid-b";
    rerender();
    await actAsync(async () => {
      finish();
      await operation;
    });
    expect(onSuccess).not.toHaveBeenCalled();
    expect(result.current.pending).toBe(false);
  });
});
