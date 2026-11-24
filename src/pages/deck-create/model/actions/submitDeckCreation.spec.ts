import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDeck, waitForDeck } from "@/entities/deck";
import { showToast } from "@/shared/ui/toast";
import { deckCreatePageStore } from "../store";
import { submitDeckCreation } from "./submitDeckCreation";

const auth = vi.hoisted(() => ({ uid: "owner" }));
vi.mock("@/entities/auth", () => ({ getAuthUid: () => auth.uid }));
vi.mock("@/entities/deck", () => ({ createDeck: vi.fn(), waitForDeck: vi.fn() }));
vi.mock("@/shared/ui/toast", () => ({ showToast: vi.fn() }));

describe("Deck creation account guards [DECK-MANAGEMENT-05 DECK-MANAGEMENT-06]", () => {
  beforeEach(() => {
    // Given: Establish the shared setup used by the following cases.
    vi.resetAllMocks();
    auth.uid = "owner";
    deckCreatePageStore.setState(deckCreatePageStore.getInitialState(), true);
  });

  it.each(["success", "failure"])("discards old-account %s and allows a new creation", async (outcome) => {
    // Given: The current account has an unacknowledged Deck creation.
    const pending = Promise.withResolvers<void>();
    vi.mocked(createDeck).mockReturnValue(pending.promise);
    vi.mocked(waitForDeck).mockResolvedValue(true);
    const values = { name: "Deck", category: "raw" };
    const result = submitDeckCreation(values, new AbortController().signal);

    // When: The account changes before the write settles.
    auth.uid = "next-user";
    if (outcome === "failure") pending.reject(new Error("denied"));
    else pending.resolve();

    // Then: The previous account's result is discarded without feedback.
    await expect(result).resolves.toBeUndefined();
    expect(showToast).not.toHaveBeenCalled();

    // When: The current account creates a Deck that reaches the read model.
    vi.mocked(createDeck).mockResolvedValue(undefined);
    const currentDeckId = await submitDeckCreation(values, new AbortController().signal);

    // Then: The current account receives its new Deck ID and success feedback.
    expect(currentDeckId).toEqual(expect.any(String));
    expect(showToast).toHaveBeenCalledWith({
      messageKey: "deckForm.toast.created",
      messageParams: { name: "Deck" },
      tone: "success",
    });
  });
});
