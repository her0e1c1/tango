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
vi.mock("@/entities/card", () => ({
  useCard: () => mocks.card ?? undefined,
}));
vi.mock("@/entities/deck", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/deck")>();
  return {
    ...actual,
    useDeck: () => mocks.deck ?? undefined,
  };
});
vi.mock("@/features/card-view", () => ({
  CardView: ({ card, deck }: { card: Card; deck: Deck }) => <div>{`Card view: ${card.id} / ${deck.id}`}</div>,
}));
vi.mock("react-router-dom", () => ({
  useParams: () => mocks.params,
  useNavigate: () => mocks.navigate,
}));

import { CardViewPage } from "./CardViewPage";

describe("CardViewPage", () => {
  const card = createCard({
    id: "card-id",
    deckId: "deck-id",
  });

  beforeEach(() => {
    mocks.params.id = "card-id";
    mocks.card = card;
    mocks.deck = createDeck({ id: "deck-id", category: "raw" });
    mocks.navigate.mockReset();
  });

  it("connects the available card and deck to the feature", () => {
    render(<CardViewPage />);

    expect(screen.getByText("Card view: card-id / deck-id")).toBeVisible();
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
