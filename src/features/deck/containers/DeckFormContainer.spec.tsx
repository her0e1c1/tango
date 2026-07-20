/**
 * @file Verifies the "DeckFormContainer" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "submits the current deck",
 * "submits an edited name", "submits an edited URL".
 */

import userEvent from "@testing-library/user-event";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

const mocks = vi.hoisted(() => ({
  params: { id: "deck-id" as string | undefined },
  config: { darkMode: false } as ConfigState,
  deck: null as Deck | null,
  updateAndGoToList: vi.fn(),
  goToList: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock("@/hooks/useConfig", () => ({ useConfig: () => mocks.config }));

vi.mock("@/query/useRemoteCollections", () => ({
  useRemoteCollections: () => ({
    status: "ready" as const,
    retry: vi.fn(),
    deckById: (id: string) => (mocks.deck?.id === id ? mocks.deck : undefined),
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

vi.mock("@/features/deck/hooks/useDeckActions", () => ({
  useDeckActions: () => ({
    updateAndGoToList: mocks.updateAndGoToList,
    goToList: mocks.goToList,
    pending: false,
    error: null,
    retry: vi.fn(),
  }),
}));

import { DeckFormContainer } from "@/features/deck/containers/DeckFormContainer";

describe("DeckFormContainer", () => {
  const deck: Deck = {
    id: "deck-id",
    uid: "user-id",
    name: "NAME",
    isPublic: false,
    convertToBr: false,
    url: "",
    category: "",
    createdAt: 0,
    updatedAt: 0,
    deletedAt: null,
    scoreMax: null,
    scoreMin: null,
    selectedTags: [],
    tagAndFilter: false,
  };

  beforeEach(() => {
    mocks.params.id = deck.id;
    mocks.deck = deck;
    mocks.config = { darkMode: false } as ConfigState;
    mocks.updateAndGoToList.mockReset();
    mocks.goToList.mockReset();
    mocks.navigate.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("submits the current deck", async () => {
    const view = render(<DeckFormContainer />);

    await userEvent.click(view.getByRole("button", { name: /save/i }));

    expect(mocks.updateAndGoToList).toHaveBeenCalledWith(deck);
  });

  it("submits an edited name", async () => {
    const view = render(<DeckFormContainer />);
    const input = view.container.querySelector("input[name='name']") as Element;

    await userEvent.clear(input);
    await userEvent.type(input, " UPDATED ");
    await userEvent.click(view.getByRole("button", { name: /save/i }));

    expect(mocks.updateAndGoToList).toHaveBeenCalledWith({ ...deck, name: "UPDATED" });
  });

  it("submits an edited URL", async () => {
    const view = render(<DeckFormContainer />);
    const input = view.container.querySelector("input[name='url']") as Element;

    await userEvent.type(input, "https://example.com/deck.csv");
    await userEvent.click(view.getByRole("button", { name: /save/i }));

    expect(mocks.updateAndGoToList).toHaveBeenCalledWith({ ...deck, url: "https://example.com/deck.csv" });
  });

  it("submits the convert setting", async () => {
    const view = render(<DeckFormContainer />);
    const input = view.container.querySelector("input[name='convertToBr']") as Element;

    await userEvent.click(input);
    await userEvent.click(view.getByRole("button", { name: /save/i }));

    expect(mocks.updateAndGoToList).toHaveBeenCalledWith({ ...deck, convertToBr: true });
  });

  it("submits an edited category", async () => {
    const view = render(<DeckFormContainer />);
    const select = view.container.querySelector("select[name='category']") as Element;

    await userEvent.selectOptions(select, "math");
    await userEvent.click(view.getByRole("button", { name: /save/i }));

    expect(mocks.updateAndGoToList).toHaveBeenCalledWith({ ...deck, category: "math" });
  });

  it("blocks a blank name and malformed URL", async () => {
    const view = render(<DeckFormContainer />);
    const name = view.container.querySelector("input[name='name']") as Element;
    const url = view.container.querySelector("input[name='url']") as Element;

    await userEvent.clear(name);
    await userEvent.type(name, "   ");
    await userEvent.type(url, "not-a-url");
    await userEvent.click(view.getByRole("button", { name: /save/i }));

    expect(view.getByText("Deck name is required.")).toBeInTheDocument();
    expect(view.getByText("Enter a valid URL.")).toBeInTheDocument();
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(url).toHaveAttribute("aria-invalid", "true");
    expect(mocks.updateAndGoToList).not.toHaveBeenCalled();
  });

  it("cancels without submitting", async () => {
    const view = render(<DeckFormContainer />);

    await userEvent.click(view.getByRole("button", { name: "Cancel" }));

    expect(mocks.goToList).toHaveBeenCalledOnce();
    expect(mocks.updateAndGoToList).not.toHaveBeenCalled();
  });

  it("does not render the unavailable public setting", () => {
    const view = render(<DeckFormContainer />);

    expect(view.container.querySelector("input[name='isPublic']")).not.toBeInTheDocument();
  });

  it("shows recovery actions when the deck is unavailable", () => {
    mocks.deck = null;
    const view = render(<DeckFormContainer />);

    expect(view.getByRole("heading", { level: 1, name: "Deck not found" })).toBeInTheDocument();
    expect(view.getByRole("button", { name: "Go home" })).toBeInTheDocument();
    expect(view.getByRole("button", { name: "Go back" })).toBeInTheDocument();
  });

  it("goes home when deck recovery is requested", async () => {
    mocks.deck = null;
    const view = render(<DeckFormContainer />);

    await userEvent.click(view.getByRole("button", { name: "Go home" }));

    expect(mocks.navigate).toHaveBeenCalledWith("/");
  });

  it("goes back when deck recovery is requested", async () => {
    mocks.deck = null;
    const view = render(<DeckFormContainer />);

    await userEvent.click(view.getByRole("button", { name: "Go back" }));

    expect(mocks.navigate).toHaveBeenCalledWith(-1);
  });

  it("preserves the invalid route error", () => {
    mocks.params.id = undefined;

    expect(() => render(<DeckFormContainer />)).toThrowError("invalid deck id");
  });
});
