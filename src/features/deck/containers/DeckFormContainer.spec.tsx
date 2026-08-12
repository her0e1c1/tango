/**
 * @file Verifies the "DeckFormContainer" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "submits the current deck",
 * "submits an edited name", "submits an edited URL".
 */

import type { Deck } from "@/entities/deck";
import type { ConfigState } from "@/shared/config";

import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { createConfig } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  params: { id: "deck-id" as string | undefined },
  config: null as unknown as ConfigState,
  deck: null as Deck | null,
  updateAndGoToList: vi.fn(),
  goToList: vi.fn(),
  navigate: vi.fn(),
  setDarkMode: vi.fn(),
}));

vi.mock("@/shared/config", () => ({
  useConfig: () => mocks.config,
  setDarkMode: mocks.setDarkMode,
}));

vi.mock("@/entities/deck", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/deck")>();
  return {
    ...actual,
    useDecks: () => ({
      status: "ready" as const,
      retry: vi.fn(),
      decksById: mocks.deck == null ? {} : { [mocks.deck.id]: mocks.deck },
    }),
  };
});

vi.mock("react-router-dom", () => ({
  useParams: () => mocks.params,
  useNavigate: () => mocks.navigate,
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
    mocks.config = createConfig({ appearance: { darkMode: false } });
    mocks.updateAndGoToList.mockReset();
    mocks.goToList.mockReset();
    mocks.navigate.mockReset();
    mocks.setDarkMode.mockReset();
  });

  it("submits the current deck", async () => {
    render(<DeckFormContainer />);

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(mocks.updateAndGoToList).toHaveBeenCalledWith(deck);
  });

  it("forwards header actions", async () => {
    render(<DeckFormContainer />);

    await userEvent.click(screen.getByRole("button", { name: "tango" }));
    await userEvent.click(screen.getByRole("button", { name: "Switch to dark mode" }));
    await userEvent.click(screen.getByRole("button", { name: "Import decks" }));
    await userEvent.click(screen.getByRole("button", { name: "Open settings" }));

    expect(mocks.setDarkMode).toHaveBeenCalledExactlyOnceWith(true);
    expect(mocks.navigate).toHaveBeenNthCalledWith(1, "/");
    expect(mocks.navigate).toHaveBeenNthCalledWith(2, "/import");
    expect(mocks.navigate).toHaveBeenNthCalledWith(3, "/settings");
  });

  it("submits an edited name", async () => {
    render(<DeckFormContainer />);
    const input = screen.getByRole("textbox", { name: "Name" });

    await userEvent.clear(input);
    await userEvent.type(input, " UPDATED ");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(mocks.updateAndGoToList).toHaveBeenCalledWith({ ...deck, name: "UPDATED" });
  });

  it("submits an edited URL", async () => {
    render(<DeckFormContainer />);
    const input = screen.getByRole("textbox", { name: "Source URL" });

    await userEvent.type(input, "https://example.com/deck.csv");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(mocks.updateAndGoToList).toHaveBeenCalledWith({ ...deck, url: "https://example.com/deck.csv" });
  });

  it("submits the convert setting", async () => {
    render(<DeckFormContainer />);
    const input = screen.getByRole("checkbox", { name: "Convert line breaks" });

    await userEvent.click(input);
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(mocks.updateAndGoToList).toHaveBeenCalledWith({ ...deck, convertToBr: true });
  });

  it("submits an edited category", async () => {
    render(<DeckFormContainer />);
    const select = screen.getByRole("combobox");

    await userEvent.selectOptions(select, "math");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(mocks.updateAndGoToList).toHaveBeenCalledWith({ ...deck, category: "math" });
  });

  it("blocks a blank name and malformed URL", async () => {
    render(<DeckFormContainer />);
    const name = screen.getByRole("textbox", { name: "Name" });
    const url = screen.getByRole("textbox", { name: "Source URL" });

    await userEvent.clear(name);
    await userEvent.type(name, "   ");
    await userEvent.type(url, "not-a-url");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(screen.getByText("Deck name is required.")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid URL.")).toBeInTheDocument();
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(url).toHaveAttribute("aria-invalid", "true");
    expect(mocks.updateAndGoToList).not.toHaveBeenCalled();
  });

  it("cancels without submitting", async () => {
    render(<DeckFormContainer />);

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(mocks.goToList).toHaveBeenCalledOnce();
    expect(mocks.updateAndGoToList).not.toHaveBeenCalled();
  });

  it("does not render the unavailable public setting", () => {
    render(<DeckFormContainer />);

    expect(screen.queryByRole("checkbox", { name: "Public" })).not.toBeInTheDocument();
  });

  it("shows recovery actions when the deck is unavailable", () => {
    mocks.deck = null;
    render(<DeckFormContainer />);

    expect(screen.getByRole("heading", { level: 1, name: "Deck not found" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go home" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go back" })).toBeInTheDocument();
  });

  it("goes home when deck recovery is requested", async () => {
    mocks.deck = null;
    render(<DeckFormContainer />);

    await userEvent.click(screen.getByRole("button", { name: "Go home" }));

    expect(mocks.navigate).toHaveBeenCalledWith("/");
  });

  it("goes back when deck recovery is requested", async () => {
    mocks.deck = null;
    render(<DeckFormContainer />);

    await userEvent.click(screen.getByRole("button", { name: "Go back" }));

    expect(mocks.navigate).toHaveBeenCalledWith(-1);
  });

  it("preserves the invalid route error", () => {
    mocks.params.id = undefined;

    expect(() => render(<DeckFormContainer />)).toThrowError("invalid deck id");
  });
});
