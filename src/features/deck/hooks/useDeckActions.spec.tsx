/**
 * @file Verifies the "useDeckActions" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "navigates to the deck list
 * after a successful update", "keeps the editor open when the update fails", "goes directly to the
 * deck list without updating".
 */

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createDeck } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateFilter: vi.fn(),
  remove: vi.fn(),
  retry: vi.fn(),
  deckById: vi.fn(),
  updateFailure: undefined as Error | undefined,
}));

vi.mock("react-router-dom", () => ({ useNavigate: () => mocks.navigate }));

vi.mock("@/features/deck/hooks/useDeckMutations", () => ({
  useDeckMutations: () => ({
    create: mocks.create,
    update: mocks.update,
    updateFilter: mocks.updateFilter,
    remove: mocks.remove,
    pending: false,
    error: null,
    retry: mocks.retry,
  }),
}));

vi.mock("@/hooks/useRemoteCollections", () => ({
  useRemoteCollections: () => ({ deckById: mocks.deckById }),
}));

import { useDeckActions } from "@/features/deck/hooks/useDeckActions";

describe("useDeckActions", () => {
  const deck = createDeck({ id: "deck-id" });

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateFailure = undefined;
    mocks.update.mockImplementation(async (_deck, lifecycle) => {
      const context = await lifecycle?.onMutate?.();
      if (mocks.updateFailure != null) {
        await lifecycle?.onError?.(mocks.updateFailure, context);
        await lifecycle?.onSettled?.(context);
        throw mocks.updateFailure;
      }
      await lifecycle?.onSuccess?.(context);
      await lifecycle?.onSettled?.(context);
    });
  });

  afterEach(cleanup);

  it("navigates to the deck list after a successful update", async () => {
    const { result } = renderHook(() => useDeckActions(deck.id));

    await act(async () => {
      await result.current.updateAndGoToList(deck);
    });

    expect(mocks.update).toHaveBeenCalledWith(deck, expect.objectContaining({ onSuccess: expect.any(Function) }));
    expect(mocks.navigate).toHaveBeenCalledExactlyOnceWith("/", { replace: true });
  });

  it("keeps the editor open when the update fails", async () => {
    mocks.updateFailure = new Error("offline");
    const { result } = renderHook(() => useDeckActions(deck.id));

    await act(async () => {
      await result.current.updateAndGoToList(deck);
    });

    expect(mocks.update).toHaveBeenCalledWith(deck, expect.objectContaining({ onSuccess: expect.any(Function) }));
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("writes only the Deck filter patch", async () => {
    const patch = { selectedTags: ["tag"], tagAndFilter: true, scoreMin: -1, scoreMax: 2 };
    const { result } = renderHook(() => useDeckActions(deck.id));

    await act(async () => result.current.updateFilter(patch));

    expect(mocks.updateFilter).toHaveBeenCalledExactlyOnceWith(deck.id, patch);
  });

  it("goes directly to the deck list without updating", () => {
    const { result } = renderHook(() => useDeckActions(deck.id));

    act(() => result.current.goToList());

    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.navigate).toHaveBeenCalledExactlyOnceWith("/", { replace: true });
  });
});
