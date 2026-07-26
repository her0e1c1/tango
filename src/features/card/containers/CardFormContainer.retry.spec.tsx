/** @file Verifies a failed Card save retries its success navigation as one use case. */

import { cleanup, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import type { MutationLifecycle } from "@/hooks/mutationLifecycle";

const mocks = vi.hoisted(() => ({
  params: { id: "card-retry" as string | undefined },
  card: null as Card | null,
  navigate: vi.fn(),
  remoteUpdate: vi.fn(),
  retry: vi.fn(),
  retryTask: undefined as (() => Promise<void>) | undefined,
  error: null as unknown,
}));

vi.mock("@/hooks/useConfig", () => ({ useConfig: () => ({ darkMode: false }) }));
vi.mock("@/hooks/useRemoteCollections", () => ({
  useRemoteCollections: () => ({
    status: "ready" as const,
    retry: vi.fn(),
    cardById: (id: string) => (mocks.card?.id === id ? mocks.card : undefined),
  }),
}));
vi.mock("react-router-dom", () => ({
  useParams: () => mocks.params,
  useNavigate: () => mocks.navigate,
}));
vi.mock("@/hooks/useActions", () => ({
  useActions: () => ({
    goToTop: vi.fn(),
    goByMenu: vi.fn(),
    setDarkMode: vi.fn(),
  }),
}));
vi.mock("@/features/card/hooks/useCardMutations", () => ({
  useCardMutations: () => {
    const update = async <Context,>(card: CardEdit, lifecycle?: MutationLifecycle<Context>): Promise<void> => {
      const task = async () => {
        let context: Context | undefined;
        try {
          context = await lifecycle?.onMutate?.();
          await mocks.remoteUpdate(card);
          await lifecycle?.onSuccess?.(context);
          mocks.error = null;
        } catch (error) {
          mocks.error = error;
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
      pending: false,
      error: mocks.error,
      retry: mocks.retry,
    };
  },
}));

import { CardFormContainer } from "@/features/card/containers/CardFormContainer";
import { createCard } from "@/test/factories";

describe("CardFormContainer retry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.card = createCard({ id: "card-retry", deckId: "deck-retry", frontText: "Retry me" });
    mocks.params.id = mocks.card.id;
    mocks.retryTask = undefined;
    mocks.error = null;
  });

  afterEach(cleanup);

  it("shows the failed save and navigates back after Retry succeeds", async () => {
    mocks.remoteUpdate.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(undefined);
    const view = render(<CardFormContainer />);

    await userEvent.click(view.getByRole("button", { name: /save/i }));

    expect(mocks.navigate).not.toHaveBeenCalled();
    view.rerender(<CardFormContainer />);
    expect(view.getByRole("alert")).toHaveTextContent("Unable to save changes.");

    await userEvent.click(view.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledExactlyOnceWith(-1));
    expect(mocks.remoteUpdate).toHaveBeenCalledTimes(2);
    expect(mocks.remoteUpdate.mock.calls[0]?.[0]).toEqual(mocks.remoteUpdate.mock.calls[1]?.[0]);
  });
});
