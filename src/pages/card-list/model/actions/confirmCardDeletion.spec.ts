import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteCard } from "@/entities/card";
import { showToast } from "@/shared/ui/toast";
import { cardListStore } from "../store";
import { confirmCardDeletion } from "./confirmCardDeletion";

const auth = vi.hoisted(() => ({ uid: "owner" }));
vi.mock("@/entities/auth", () => ({ getAuthUid: () => auth.uid }));
vi.mock("@/entities/card", () => ({ deleteCard: vi.fn() }));
vi.mock("@/shared/ui/toast", () => ({ showToast: vi.fn() }));

describe("Card deletion account guards [CARD-MANAGEMENT-02 CARD-MANAGEMENT-08]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.uid = "owner";
    cardListStore.setState(cardListStore.getInitialState(), true);
  });

  it.each(["success", "failure"])("ignores old-account %s without closing the current selection", async (outcome) => {
    const pending = Promise.withResolvers<void>();
    vi.mocked(deleteCard).mockReturnValue(pending.promise);
    cardListStore.setState({ deletionTarget: { id: "old-card", frontText: "Old" } });
    const result = confirmCardDeletion();
    auth.uid = "next-user";
    const selection = { id: "new-card", frontText: "New" };
    cardListStore.setState({ deletionTarget: selection });
    if (outcome === "failure") pending.reject(new Error("denied"));
    else pending.resolve();
    await result;
    expect(showToast).not.toHaveBeenCalled();
    expect(cardListStore.getState().deletionTarget).toEqual(selection);
    vi.mocked(deleteCard).mockResolvedValue(undefined);
    await confirmCardDeletion();
    expect(showToast).toHaveBeenCalledWith(
      expect.objectContaining({ tone: "success", messageParams: { name: "New" } })
    );
  });
});
