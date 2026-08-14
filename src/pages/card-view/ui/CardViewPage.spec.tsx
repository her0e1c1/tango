import type { Preferences } from "@/entities/preferences";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import { createCard, createPreferences, createDeck } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  params: { id: "card-id" as string | undefined },
  preferences: null as unknown as Preferences,
  card: null as Card | null,
  deck: null as Deck | null,
  cardStatus: "ready" as "loading" | "ready" | "error" | "blocked",
  navigate: vi.fn(),
  setDarkMode: vi.fn(),
}));

vi.mock("@/shared/firebase", () => ({ auth: {} }));
vi.mock("@/entities/preferences", () => ({
  usePreferences: () => mocks.preferences,
  setDarkMode: mocks.setDarkMode,
}));
vi.mock("@/entities/card", () => ({
  useCard: () => mocks.card ?? undefined,
}));
vi.mock("@/features/card/read", () => ({
  useCardReadState: () => ({
    status: mocks.cardStatus,
  }),
}));
vi.mock("@/entities/deck", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/deck")>();
  return {
    ...actual,
    useDeck: () => mocks.deck ?? undefined,
  };
});
vi.mock("react-router-dom", () => ({
  useParams: () => mocks.params,
  useNavigate: () => mocks.navigate,
}));

import { CardViewPage } from "./CardViewPage";

describe("CardViewPage", () => {
  const card = createCard({
    id: "card-id",
    deckId: "deck-id",
    backText: "const answer = 42;",
    tags: ["typescript"],
  });

  beforeEach(() => {
    mocks.params.id = "card-id";
    mocks.preferences = createPreferences({ appearance: { darkMode: false } });
    mocks.card = card;
    mocks.deck = createDeck({ id: "deck-id", category: "raw" });
    mocks.cardStatus = "ready";
    mocks.navigate.mockReset();
    mocks.setDarkMode.mockReset();
  });

  it("renders the card answer using its resolved category", () => {
    render(<CardViewPage />);

    expect(screen.getByText(/answer =/)).toHaveTextContent("const answer = 42;");
  });

  it("renders the ready screen in the application shell", () => {
    render(<CardViewPage />);

    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();
  });

  it("shows recovery actions when the card is unavailable", async () => {
    mocks.card = null;
    render(<CardViewPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Card not found" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "tango" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Go home" }));
    await userEvent.click(screen.getByRole("button", { name: "Go back" }));
    expect(mocks.navigate).toHaveBeenNthCalledWith(1, "/");
    expect(mocks.navigate).toHaveBeenNthCalledWith(2, -1);
  });

  it("preserves the invalid route error", () => {
    mocks.params.id = undefined;
    expect(() => render(<CardViewPage />)).toThrowError("invalid card id");
  });
});
