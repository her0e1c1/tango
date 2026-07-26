/**
 * @file Verifies the "CardFormContainer" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "submits the current card",
 * "returns to the previous page without saving when cancelled", "submits edited front and back
 * text".
 */

import userEvent from "@testing-library/user-event";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import type { MutationLifecycle } from "@/hooks/mutationLifecycle";

const mocks = vi.hoisted(() => ({
  params: { id: "card-id" as string | undefined },
  config: { darkMode: false } as ConfigState,
  card: null as Card | null,
  cardUpdate: vi.fn(),
  cardUpdateFailure: undefined as Error | undefined,
  navigate: vi.fn(),
}));

vi.mock("@/hooks/useConfig", () => ({ useConfig: () => mocks.config }));

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

vi.mock("@/features/card/hooks/useCardMutations", () => ({
  useCardMutations: () => ({
    update: mocks.cardUpdate,
    pending: false,
    error: null,
    retry: vi.fn(),
  }),
}));

vi.mock("@/hooks/useActions", () => ({
  useActions: () => ({
    goToTop: vi.fn(),
    goByMenu: vi.fn(),
    setDarkMode: vi.fn(),
  }),
}));

import { CardFormContainer } from "@/features/card/containers/CardFormContainer";

describe("CardFormContainer", () => {
  const card: Card = {
    id: "card-id",
    deckId: "deck-id",
    uid: "user-id",
    frontText: "FRONT TEXT",
    backText: "BACK TEXT",
    tags: [],
    uniqueKey: "unique-key",
    score: 0,
    numberOfSeen: 0,
    createdAt: 1,
    updatedAt: 1,
    deletedAt: null,
    lastSeenAt: 1,
  };

  beforeEach(() => {
    mocks.params.id = card.id;
    mocks.card = card;
    mocks.config = { darkMode: false } as ConfigState;
    mocks.cardUpdateFailure = undefined;
    mocks.cardUpdate.mockReset().mockImplementation(
      async (_card: CardEdit, lifecycle?: MutationLifecycle<unknown>): Promise<void> => {
        const context = await lifecycle?.onMutate?.();
        try {
          if (mocks.cardUpdateFailure != null) throw mocks.cardUpdateFailure;
          await lifecycle?.onSuccess?.(context);
        } catch (error) {
          await lifecycle?.onError?.(error, context);
          throw error;
        } finally {
          await lifecycle?.onSettled?.(context);
        }
      }
    );
    mocks.navigate.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("submits the current card", async () => {
    const view = render(<CardFormContainer />);

    await userEvent.click(view.getByRole("button", { name: /save/i }));

    expect(mocks.cardUpdate).toHaveBeenCalledWith(card, expect.objectContaining({ onSuccess: expect.any(Function) }));
    expect(mocks.navigate).toHaveBeenCalledWith(-1);
  });

  it("returns to the previous page without saving when cancelled", async () => {
    const view = render(<CardFormContainer />);

    await userEvent.click(view.getByRole("button", { name: "Cancel" }));

    expect(mocks.cardUpdate).not.toHaveBeenCalled();
    expect(mocks.navigate).toHaveBeenCalledWith(-1);
  });

  it("submits edited front and back text", async () => {
    const view = render(<CardFormContainer />);
    const frontText = view.container.querySelector("textarea[name='frontText']") as Element;
    const backText = view.container.querySelector("textarea[name='backText']") as Element;

    await userEvent.clear(frontText);
    await userEvent.type(frontText, " UPDATED FRONT ");
    await userEvent.clear(backText);
    await userEvent.type(backText, " UPDATED BACK ");
    await userEvent.click(view.getByRole("button", { name: /save/i }));

    expect(mocks.cardUpdate).toHaveBeenCalledWith(
      { ...card, frontText: " UPDATED FRONT ", backText: " UPDATED BACK " },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  it("submits edited tags", async () => {
    const view = render(<CardFormContainer />);

    await userEvent.click(view.container.querySelector("input[name='tags'][value='math']") as Element);
    await userEvent.click(view.getByRole("button", { name: /save/i }));

    expect(mocks.cardUpdate).toHaveBeenCalledWith(
      { ...card, tags: ["math"] },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  it("blocks blank front and back text", async () => {
    const view = render(<CardFormContainer />);
    const frontText = view.container.querySelector("textarea[name='frontText']") as Element;
    const backText = view.container.querySelector("textarea[name='backText']") as Element;

    await userEvent.clear(frontText);
    await userEvent.type(frontText, "   ");
    await userEvent.clear(backText);
    await userEvent.type(backText, "   ");
    await userEvent.click(view.getByRole("button", { name: /save/i }));

    expect(view.getByText("Front text is required.")).toBeInTheDocument();
    expect(view.getByText("Back text is required.")).toBeInTheDocument();
    expect(frontText).toHaveAttribute("aria-invalid", "true");
    expect(backText).toHaveAttribute("aria-invalid", "true");
    expect(mocks.cardUpdate).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("does not navigate when the Card write fails", async () => {
    mocks.cardUpdateFailure = new Error("write failed");
    const view = render(<CardFormContainer />);

    await userEvent.click(view.getByRole("button", { name: /save/i }));

    expect(mocks.cardUpdate).toHaveBeenCalledWith(card, expect.objectContaining({ onSuccess: expect.any(Function) }));
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("shows recovery actions when the card is unavailable", () => {
    mocks.card = null;
    const view = render(<CardFormContainer />);

    expect(view.getByRole("heading", { level: 1, name: "Card not found" })).toBeInTheDocument();
    expect(view.getByRole("button", { name: "Go home" })).toBeInTheDocument();
    expect(view.getByRole("button", { name: "Go back" })).toBeInTheDocument();
  });

  it("goes home when card recovery is requested", async () => {
    mocks.card = null;
    const view = render(<CardFormContainer />);

    await userEvent.click(view.getByRole("button", { name: "Go home" }));

    expect(mocks.navigate).toHaveBeenCalledWith("/");
  });

  it("goes back when card recovery is requested", async () => {
    mocks.card = null;
    const view = render(<CardFormContainer />);

    await userEvent.click(view.getByRole("button", { name: "Go back" }));

    expect(mocks.navigate).toHaveBeenCalledWith(-1);
  });

  it("preserves the invalid route error", () => {
    mocks.params.id = undefined;

    expect(() => render(<CardFormContainer />)).toThrowError("invalid card id");
  });
});
