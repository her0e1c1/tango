import userEvent from "@testing-library/user-event";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

const mocks = vi.hoisted(() => ({
  params: { id: "card-id" as string | undefined },
  state: undefined as unknown as RootState,
  cardUpdateAndBack: vi.fn(),
}));

vi.mock("react-redux", () => ({
  useSelector: (select: (state: RootState) => unknown) => select(mocks.state),
}));

vi.mock("react-router-dom", () => ({
  useParams: () => mocks.params,
}));

vi.mock("@src/shared/hooks/useActions", () => ({
  useActions: () => ({
    cardUpdateAndBack: mocks.cardUpdateAndBack,
    goToTop: vi.fn(),
    goByMenu: vi.fn(),
    setDarkMode: vi.fn(),
  }),
}));

import { CardFormContainer } from "@src/features/card/containers/CardFormContainer";

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
    mocks.state = {
      deck: { byId: {}, categories: [] },
      config: { darkMode: false } as ConfigState,
      card: { byId: { [card.id]: card }, tags: [] },
    };
    mocks.cardUpdateAndBack.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("submits the current card", async () => {
    const view = render(<CardFormContainer />);

    await userEvent.click(view.getByRole("button", { name: /save/i }));

    expect(mocks.cardUpdateAndBack).toHaveBeenCalledWith(card);
  });

  it("submits edited front and back text", async () => {
    const view = render(<CardFormContainer />);
    const frontText = view.container.querySelector("textarea[name='frontText']") as Element;
    const backText = view.container.querySelector("textarea[name='backText']") as Element;

    await userEvent.clear(frontText);
    await userEvent.type(frontText, "UPDATED FRONT");
    await userEvent.clear(backText);
    await userEvent.type(backText, "UPDATED BACK");
    await userEvent.click(view.getByRole("button", { name: /save/i }));

    expect(mocks.cardUpdateAndBack).toHaveBeenCalledWith({
      ...card,
      frontText: "UPDATED FRONT",
      backText: "UPDATED BACK",
    });
  });

  it("submits edited tags", async () => {
    const view = render(<CardFormContainer />);

    await userEvent.click(view.container.querySelector("input[name='tags'][value='math']") as Element);
    await userEvent.click(view.getByRole("button", { name: /save/i }));

    expect(mocks.cardUpdateAndBack).toHaveBeenCalledWith({ ...card, tags: ["math"] });
  });

  it("preserves the invalid route error", () => {
    mocks.params.id = undefined;

    expect(() => CardFormContainer({})).toThrowError("invalid card id");
  });
});
