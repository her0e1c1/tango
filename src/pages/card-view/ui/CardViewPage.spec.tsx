import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import { createCard, createDeck } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  params: { id: "card-id" as string | undefined },
  card: null as Card | null,
  deck: null as Deck | null,
  navigate: vi.fn(),
}));

vi.mock("@/shared/firebase", () => ({ auth: {} }));
vi.mock("@/hooks/useConfig", () => ({ useConfig: () => ({ darkMode: false }) }));
vi.mock("@/hooks/useActions", () => ({
  useActions: () => ({
    setDarkMode: vi.fn(),
    goToTop: vi.fn(),
    goToImport: vi.fn(),
    goToSettings: vi.fn(),
  }),
}));
vi.mock("@/hooks/useRemoteCollections", () => ({
  useRemoteCollections: () => ({
    status: "ready" as const,
    retry: vi.fn(),
    cardById: (id: string) => (mocks.card?.id === id ? mocks.card : undefined),
    deckById: (id: string) => (mocks.deck?.id === id ? mocks.deck : undefined),
  }),
}));
vi.mock("react-router-dom", () => ({
  useParams: () => mocks.params,
  useNavigate: () => mocks.navigate,
}));

import { CardViewPage } from "./CardViewPage";

describe("CardViewPage", () => {
  beforeEach(() => {
    mocks.params.id = "card-id";
    mocks.deck = createDeck({ id: "deck-id", category: "raw" });
    mocks.card = createCard({ id: "card-id", deckId: "deck-id", backText: "const answer = 42;", tags: ["typescript"] });
    mocks.navigate.mockReset();
  });

  it("renders the card answer using its resolved category", () => {
    render(<CardViewPage />);

    expect(screen.getByText(/answer =/)).toHaveTextContent("const answer = 42;");
  });

  it("shows recovery actions when the card is unavailable", async () => {
    mocks.card = null;
    render(<CardViewPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Card not found" })).toBeInTheDocument();
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
