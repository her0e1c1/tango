import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createDeck } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  retry: vi.fn(),
  deckById: vi.fn(),
}));

vi.mock("react-router-dom", () => ({ useNavigate: () => mocks.navigate }));

vi.mock("@/hooks/deck/useDeckMutations", () => ({
  useDeckMutations: () => ({
    create: mocks.create,
    update: mocks.update,
    remove: mocks.remove,
    pending: false,
    error: null,
    retry: mocks.retry,
  }),
}));

vi.mock("@/query/useRemoteCollections", () => ({
  useRemoteCollections: () => ({ deckById: mocks.deckById }),
}));

import { useDeckActions } from "@/features/deck/hooks/useDeckActions";

describe("useDeckActions", () => {
  const deck = createDeck({ id: "deck-id" });

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.update.mockResolvedValue(undefined);
  });

  afterEach(cleanup);

  it("navigates to the deck list after a successful update", async () => {
    const { result } = renderHook(() => useDeckActions(deck.id));

    await act(async () => {
      await result.current.updateAndGoToList(deck);
    });

    expect(mocks.update).toHaveBeenCalledExactlyOnceWith(deck);
    expect(mocks.navigate).toHaveBeenCalledExactlyOnceWith("/", { replace: true });
  });

  it("keeps the editor open when the update fails", async () => {
    mocks.update.mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useDeckActions(deck.id));

    await act(async () => {
      await result.current.updateAndGoToList(deck);
    });

    expect(mocks.update).toHaveBeenCalledExactlyOnceWith(deck);
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("goes directly to the deck list without updating", () => {
    const { result } = renderHook(() => useDeckActions(deck.id));

    act(() => result.current.goToList());

    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.navigate).toHaveBeenCalledExactlyOnceWith("/", { replace: true });
  });
});
