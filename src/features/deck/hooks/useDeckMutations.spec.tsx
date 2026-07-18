import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { firestoreKeys } from "@/query/firestoreKeys";
import { createQueryWrapper, createTestQueryClient } from "@/query/testUtils";
import { createDeck } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("@/auth/AuthContext", () => ({
  useAuth: () => ({ status: "authenticated", uid: "uid-a", user: { uid: "uid-a" } }),
}));
vi.mock("@/action/firestore", () => ({
  deck: {
    create: mocks.create,
    update: mocks.update,
    remove: mocks.remove,
  },
}));

import { useDeckMutations } from "@/features/deck/hooks/useDeckMutations";

describe("useDeckMutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.create.mockResolvedValue("deck-id");
    mocks.update.mockResolvedValue(undefined);
    mocks.remove.mockResolvedValue(undefined);
  });

  it("shares one in-flight removal for the same Deck", async () => {
    let finishRemove: () => void = () => undefined;
    mocks.remove.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishRemove = resolve;
        })
    );
    const deck = createDeck({ id: "deck-a" });
    const otherDeck = createDeck({ id: "deck-b" });
    const client = createTestQueryClient();
    client.setQueryData(firestoreKeys.decks("uid-a"), { [deck.id]: deck, [otherDeck.id]: otherDeck });
    const { result } = renderHook(useDeckMutations, { wrapper: createQueryWrapper(client) });
    let firstRemove: Promise<void> | undefined;
    let secondRemove: Promise<void> | undefined;

    act(() => {
      firstRemove = result.current.remove(deck);
      secondRemove = result.current.remove(deck);
    });

    try {
      await waitFor(() => {
        expect(mocks.remove).toHaveBeenCalledExactlyOnceWith(deck.id, "uid-a");
        expect(result.current.pending).toBe(true);
        expect(result.current.isPending(deck.id)).toBe(true);
        expect(result.current.isPending(otherDeck.id)).toBe(false);
      });
      expect(secondRemove).toBe(firstRemove);
    } finally {
      await act(async () => {
        finishRemove();
        await firstRemove;
      });
    }

    expect(result.current.pending).toBe(false);
    expect(result.current.isPending(deck.id)).toBe(false);
  });

  it("keeps a failed removal available for a safe retry", async () => {
    const deck = createDeck({ id: "deck-a" });
    const error = new Error("delete failed");
    mocks.remove.mockRejectedValueOnce(error).mockResolvedValueOnce(undefined);
    const client = createTestQueryClient();
    client.setQueryData(firestoreKeys.decks("uid-a"), { [deck.id]: deck });
    const { result } = renderHook(useDeckMutations, { wrapper: createQueryWrapper(client) });

    await act(async () => {
      await expect(result.current.remove(deck)).rejects.toThrow(error);
    });

    await waitFor(() => expect(result.current.error).toBe(error));
    act(() => result.current.retry());
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledTimes(2));
  });
});
