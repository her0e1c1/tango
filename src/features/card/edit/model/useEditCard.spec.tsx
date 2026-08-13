import type { Card } from "@/entities/card";

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { actAsync } from "@/test/act";
import { createCard as createCardFixture } from "@/test/factories";

const mocks = vi.hoisted(() => ({ uid: "uid-a", editCard: vi.fn() }));

vi.mock("@/entities/auth-session", () => ({
  useAuthSession: () =>
    mocks.uid === ""
      ? { status: "signedOut" }
      : { status: "authenticated", uid: mocks.uid, isAnonymous: true, displayName: null },
}));
vi.mock("../api/editCard", () => ({ editCard: mocks.editCard }));

import { useEditCard } from "./useEditCard";

const card = createCardFixture({ id: "card", deckId: "deck", uid: "uid-a" }) as Card;

describe("useEditCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.uid = "uid-a";
    mocks.editCard.mockResolvedValue(undefined);
  });

  it("adds the target Card id to an editable field patch", async () => {
    const { result } = renderHook(useEditCard);
    await actAsync(() => result.current.updateBy(card, () => ({ frontText: "Updated" })));
    expect(mocks.editCard).toHaveBeenCalledWith("uid-a", { id: card.id, frontText: "Updated" });
  });

  it("exposes pending state and retries the latest failed edit", async () => {
    let finish!: () => void;
    mocks.editCard
      .mockReturnValueOnce(new Promise<void>((resolve) => (finish = resolve)))
      .mockRejectedValueOnce(new Error("write failed"))
      .mockResolvedValueOnce(undefined);
    const { result } = renderHook(useEditCard);
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.update(card);
    });
    await waitFor(() => expect(result.current.isPending(card.id)).toBe(true));
    await actAsync(async () => {
      finish();
      await pending;
    });

    await actAsync(async () => {
      await expect(result.current.update(card)).rejects.toThrow("write failed");
    });
    act(() => result.current.retry());
    await waitFor(() => {
      expect(mocks.editCard).toHaveBeenCalledTimes(3);
      expect(result.current.error).toBeNull();
    });
  });

  it("clears obsolete mutation state after the authenticated UID changes", async () => {
    let finish!: () => void;
    mocks.editCard.mockReturnValueOnce(new Promise<void>((resolve) => (finish = resolve)));
    const { result, rerender } = renderHook(useEditCard);
    let operation!: Promise<void>;
    act(() => {
      operation = result.current.update(card);
    });
    await waitFor(() => expect(result.current.pending).toBe(true));
    mocks.uid = "uid-b";
    rerender();
    expect(result.current.pending).toBe(false);
    await actAsync(async () => {
      finish();
      await operation;
    });
  });
});
