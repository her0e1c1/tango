/** @file Verifies a failed study swipe retries the entire optimistic use case exactly once. */

import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { MutationLifecycle } from "@/hooks/mutationLifecycle";
import { studyStore } from "@/features/study/state/studyStore";

const mocks = vi.hoisted(() => {
  const deckId = "deck-retry";
  const card1: Card = {
    id: "card-1",
    deckId,
    uid: "user",
    frontText: "front 1",
    backText: "back 1",
    tags: [],
    uniqueKey: "card-1",
    score: 2,
    numberOfSeen: 4,
    createdAt: 0,
    updatedAt: 0,
    deletedAt: null,
  };
  const card2: Card = { ...card1, id: "card-2", uniqueKey: "card-2", frontText: "front 2" };
  const config = {
    cardSwipeUp: "DoNothing",
    cardSwipeDown: "DoNothing",
    cardSwipeLeft: "GoBack",
    cardSwipeRight: "GoToNextCardMastered",
    shuffled: false,
    maxNumberOfCardsToLearn: 10,
    useCardInterval: false,
    defaultAutoPlay: false,
    hideBodyWhenCardChanged: true,
  } as ConfigState;

  return {
    deckId,
    card1,
    card2,
    config,
    remoteUpdate: vi.fn(),
    retry: vi.fn(),
    retryTask: undefined as (() => Promise<void>) | undefined,
  };
});

vi.mock("@/hooks/useConfig", () => ({ useConfig: () => mocks.config }));
vi.mock("@/hooks/useRemoteCollections", () => ({
  useRemoteCollections: () => ({
    cardsById: { [mocks.card1.id]: mocks.card1, [mocks.card2.id]: mocks.card2 },
    filteredCardsByDeckId: () => [mocks.card1, mocks.card2],
  }),
}));
vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn() }));
vi.mock("@/features/card/hooks/useCardMutations", () => ({
  useCardMutations: () => {
    const update = async <Context,>(card: CardEdit, lifecycle?: MutationLifecycle<Context>): Promise<void> => {
      const task = async () => {
        let context: Context | undefined;
        try {
          context = await lifecycle?.onMutate?.();
          await mocks.remoteUpdate(card);
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
      isPending: () => false,
      pending: false,
      error: null,
      retry: mocks.retry,
    };
  },
}));

import { useStudyActions } from "@/features/study/hooks/useStudyActions";

describe("useStudyActions retry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.retryTask = undefined;
    vi.spyOn(Date, "now").mockReturnValue(1_000);
    studyStore.setState({
      sessionsByDeckId: {},
      showBackText: true,
      autoPlay: false,
      lastSwipe: undefined,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("reapplies the optimistic advance with the same absolute Card patch after retry", async () => {
    const failure = new Error("offline");
    mocks.remoteUpdate.mockRejectedValueOnce(failure).mockResolvedValueOnce(undefined);
    studyStore.getState().startStudy(mocks.deckId, [mocks.card1.id, mocks.card2.id]);
    studyStore.setState({ showBackText: true });
    const { result } = renderHook(() => useStudyActions(mocks.deckId));

    await act(async () => result.current.swipeRight());

    expect(studyStore.getState()).toMatchObject({
      sessionsByDeckId: { [mocks.deckId]: { currentIndex: 0 } },
      showBackText: true,
      lastSwipe: undefined,
    });

    act(() => result.current.retry());

    await waitFor(() => expect(mocks.remoteUpdate).toHaveBeenCalledTimes(2));
    expect(mocks.remoteUpdate.mock.calls[0]?.[0]).toEqual(mocks.remoteUpdate.mock.calls[1]?.[0]);
    expect(mocks.remoteUpdate.mock.calls[1]?.[0]).toMatchObject({
      id: mocks.card1.id,
      deckId: mocks.deckId,
      score: 3,
      numberOfSeen: 5,
      lastSeenAt: 1_000,
    });
    expect(studyStore.getState()).toMatchObject({
      sessionsByDeckId: { [mocks.deckId]: { currentIndex: 1 } },
      showBackText: false,
      lastSwipe: "cardSwipeRight",
    });
  });

  it("ends a one-card session after a failed final swipe succeeds on retry", async () => {
    mocks.remoteUpdate.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(undefined);
    studyStore.getState().startStudy(mocks.deckId, [mocks.card1.id]);
    const { result } = renderHook(() => useStudyActions(mocks.deckId));

    await act(async () => result.current.swipeRight());
    expect(studyStore.getState().sessionsByDeckId[mocks.deckId]).toBeDefined();

    act(() => result.current.retry());

    await waitFor(() => expect(studyStore.getState().sessionsByDeckId[mocks.deckId]).toBeUndefined());
    expect(mocks.remoteUpdate).toHaveBeenCalledTimes(2);
  });
});
