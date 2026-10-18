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
    // Given: Establish the shared setup used by the following cases.
    vi.resetAllMocks();
    auth.uid = "owner";
    cardListStore.setState(cardListStore.getInitialState(), true);
  });

  it.each(["success", "failure"])("ignores old-account %s without closing the current selection", async (outcome) => {
    // Given: Prepare `pending`, `result`, `selection` and any shared test state below.
    const pending = Promise.withResolvers<void>();
    vi.mocked(deleteCard).mockReturnValue(pending.promise);
    cardListStore.setState({ deletionTarget: { id: "old-card", frontText: "Old" } });
    const result = confirmCardDeletion();
    auth.uid = "next-user";
    const selection = { id: "new-card", frontText: "New" };
    // When: Exercise `cardListStore.setState` with the prepared inputs.
    cardListStore.setState({ deletionTarget: selection });
    if (outcome === "failure") pending.reject(new Error("denied"));
    else pending.resolve();
    await result;
    // Then: Verify the expected result in the assertions below.
    expect(showToast).not.toHaveBeenCalled();
    expect(cardListStore.getState().deletionTarget).toEqual(selection);
    vi.mocked(deleteCard).mockResolvedValue(undefined);
    // When: Exercise `confirmCardDeletion` with the prepared inputs.
    await confirmCardDeletion();
    // Then: Verify the expected result in the assertions below.
    expect(showToast).toHaveBeenCalledWith(
      expect.objectContaining({ tone: "success", messageParams: { name: "New" } })
    );
  });
});
