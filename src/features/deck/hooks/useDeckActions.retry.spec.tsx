/** @file Verifies a failed Deck save retries its success navigation as one use case. */

import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { MutationLifecycle } from "@/hooks/mutationLifecycle";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  remoteUpdate: vi.fn(),
  retry: vi.fn(),
  retryTask: undefined as (() => Promise<void>) | undefined,
}));

vi.mock("react-router-dom", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("@/hooks/useRemoteCollections", () => ({
  useRemoteCollections: () => ({ deckById: () => undefined }),
}));
vi.mock("@/features/deck/hooks/useDeckMutations", () => ({
  useDeckMutations: () => {
    const update = async <Context,>(deck: DeckEdit, lifecycle?: MutationLifecycle<Context>): Promise<void> => {
      const task = async () => {
        let context: Context | undefined;
        try {
          context = (await lifecycle?.onMutate?.()) as Context | undefined;
          await mocks.remoteUpdate(deck);
          await lifecycle?.onSuccess?.(context);
        } catch (error) {
          await lifecycle?.onError?.(error, context);
          throw error;
        } finally {
          await lifecycle?.onSettled?.(context);
        }
      };
      mocks.retryTask = task;
      await task();
    };
    mocks.retry.mockImplementation(() => {
      void mocks.retryTask?.().catch(() => undefined);
    });
    return {
      update,
      updateFilter: vi.fn(),
      remove: vi.fn(),
      pending: false,
      error: null,
      retry: mocks.retry,
    };
  },
}));

import { useDeckActions } from "@/features/deck/hooks/useDeckActions";
import { createDeck } from "@/test/factories";

describe("useDeckActions retry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.retryTask = undefined;
  });

  afterEach(cleanup);

  it("navigates to the Deck list after a failed save succeeds on retry", async () => {
    const deck = createDeck({ id: "deck-retry", name: "Updated Deck" });
    mocks.remoteUpdate.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useDeckActions(deck.id));

    await act(async () => result.current.updateAndGoToList(deck));

    expect(mocks.remoteUpdate).toHaveBeenCalledExactlyOnceWith(deck);
    expect(mocks.navigate).not.toHaveBeenCalled();

    act(() => result.current.retry());

    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledExactlyOnceWith("/", { replace: true }));
    expect(mocks.remoteUpdate).toHaveBeenCalledTimes(2);
    expect(mocks.remoteUpdate.mock.calls[1]?.[0]).toEqual(deck);
  });
});
