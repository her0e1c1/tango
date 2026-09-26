import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDeck } from "@/entities/deck";
import { showToast } from "@/shared/ui/toast";
import { deckCreatePageStore } from "../store";
import { submitDeckCreation } from "./submitDeckCreation";

const auth = vi.hoisted(() => ({ uid: "owner" }));
vi.mock("@/entities/auth", () => ({ getAuthUid: () => auth.uid }));
vi.mock("@/entities/deck", () => ({ createDeck: vi.fn() }));
vi.mock("@/shared/ui/toast", () => ({ showToast: vi.fn() }));

describe("Deck creation account guards [DECK-MANAGEMENT-05 DECK-MANAGEMENT-06]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.uid = "owner";
    deckCreatePageStore.setState(deckCreatePageStore.getInitialState(), true);
  });

  it.each(["success", "failure"])("discards old-account %s and allows a new creation", async (outcome) => {
    const pending = Promise.withResolvers<void>();
    vi.mocked(createDeck).mockReturnValue(pending.promise);
    const values = { name: "Deck", category: "raw", convertToBr: false };
    const result = submitDeckCreation(values);
    auth.uid = "next-user";
    if (outcome === "failure") pending.reject(new Error("denied"));
    else pending.resolve();
    await expect(result).resolves.toBeUndefined();
    expect(showToast).not.toHaveBeenCalled();
    vi.mocked(createDeck).mockResolvedValue(undefined);
    await expect(submitDeckCreation(values)).resolves.toMatchObject({ name: "Deck" });
  });
});
