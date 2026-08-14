import type { Card } from "@/entities/card";

import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { actAsync } from "@/test/act";
import { createCard as createCardFixture } from "@/test/factories";

const mocks = vi.hoisted(() => ({ uid: "uid-a", deleteCard: vi.fn() }));

vi.mock("@/entities/auth", () => ({
  useAuthSession: () =>
    mocks.uid === ""
      ? { status: "unauthenticated" }
      : { status: "authenticated", uid: mocks.uid, isAnonymous: true, displayName: null },
}));
vi.mock("@/entities/card", () => ({ deleteCard: mocks.deleteCard }));

import { useDeleteCard } from "./useDeleteCard";

const card = createCardFixture({ id: "card", uid: "uid-a" }) as Card;

describe("useDeleteCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.uid = "uid-a";
    mocks.deleteCard.mockResolvedValue(undefined);
  });

  it("reports a successful removal when the original action is run again", async () => {
    const onSuccess = vi.fn();
    mocks.deleteCard.mockRejectedValueOnce(new Error("remove failed")).mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useDeleteCard({ onSuccess }));
    await actAsync(async () => {
      await expect(result.current.remove(card)).rejects.toThrow("remove failed");
    });
    expect(onSuccess).not.toHaveBeenCalled();
    await actAsync(async () => {
      await result.current.remove(card);
    });

    expect(onSuccess).toHaveBeenCalledExactlyOnceWith(card);
  });
});
