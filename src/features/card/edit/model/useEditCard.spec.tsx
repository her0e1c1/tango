import type { Card } from "@/entities/card";

import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { actAsync } from "@/test/act";
import { createCard as createCardFixture } from "@/test/factories";

const mocks = vi.hoisted(() => ({ uid: "uid-a", editCard: vi.fn() }));

vi.mock("@/entities/auth", () => ({
  useAuthSession: () =>
    mocks.uid === ""
      ? { status: "unauthenticated" }
      : { status: "authenticated", uid: mocks.uid, isAnonymous: true, displayName: null },
}));
vi.mock("@/entities/card", () => ({ editCard: mocks.editCard }));

import { useEditCard } from "./useEditCard";

const card = createCardFixture({ id: "card", deckId: "deck", uid: "uid-a" }) as Card;

describe("useEditCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.uid = "uid-a";
    mocks.editCard.mockResolvedValue(undefined);
  });

  it("adds the target Card identity to an editable field patch", async () => {
    const { result } = renderHook(useEditCard);
    await actAsync(() => result.current.updateBy(card, () => ({ frontText: "Updated" })));
    expect(mocks.editCard).toHaveBeenCalledWith("uid-a", { id: card.id, uid: card.uid, frontText: "Updated" });
  });

  it("allows the original edit action to be run again after failure", async () => {
    mocks.editCard.mockRejectedValueOnce(new Error("write failed")).mockResolvedValueOnce(undefined);
    const { result } = renderHook(useEditCard);

    await actAsync(async () => {
      await expect(result.current.update(card)).rejects.toThrow("write failed");
    });
    await actAsync(async () => {
      await result.current.update(card);
    });

    expect(mocks.editCard).toHaveBeenCalledTimes(2);
  });
});
