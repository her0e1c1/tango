import type { Deck } from "@/entities/deck";
import type { ReactNode } from "react";

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDeck } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  params: { id: "deck-id" as string | undefined },
  deck: null as Deck | null,
  navigate: vi.fn(),
}));

vi.mock("@/shared/firebase", () => ({ auth: {} }));
vi.mock("@/entities/deck", () => ({ useDeck: () => mocks.deck ?? undefined }));
vi.mock("@/features/card-list", () => ({
  CardListContainer: (props: {
    deck: Deck;
    renderBackText: (props: { text: string }) => ReactNode;
    onEditCard: (id: string) => void;
  }) => {
    return (
      <div>
        <span>{`Card list: ${props.deck.id}`}</span>
        {props.renderBackText({ text: "Back text" })}
        <button type="button" onClick={() => props.onEditCard("card-id")}>
          Edit card
        </button>
      </div>
    );
  },
}));
vi.mock("@/features/card-view", () => ({ BackText: ({ text }: { text: string }) => <div>{text}</div> }));
vi.mock("react-router-dom", () => ({
  useParams: () => mocks.params,
  useNavigate: () => mocks.navigate,
}));

import { CardListPage } from "./CardListPage";

describe("CardListPage", () => {
  const deck = createDeck({ id: "deck-id" });

  beforeEach(() => {
    mocks.params.id = deck.id;
    mocks.deck = deck;
    mocks.navigate.mockReset();
  });

  it("composes the resolved deck container and route navigation", async () => {
    render(<CardListPage />);

    expect(screen.getByText(`Card list: ${deck.id}`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Edit card" }));
    expect(mocks.navigate).toHaveBeenCalledWith("/card/card-id/edit");
  });

  it("keeps route shortcuts in the page adapter", () => {
    render(<CardListPage />);

    fireEvent.keyDown(window, { key: "t" });
    fireEvent.keyDown(window, { key: "s" });
    expect(mocks.navigate).toHaveBeenNthCalledWith(1, "/");
    expect(mocks.navigate).toHaveBeenNthCalledWith(2, "/settings");
  });

  it("renders not-found feedback with route navigation", async () => {
    mocks.deck = null;
    render(<CardListPage />);

    expect(screen.getByRole("heading", { name: "Deck not found" })).toBeInTheDocument();
    expect(screen.queryByText(`Card list: ${deck.id}`)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Go home" }));
    await userEvent.click(screen.getByRole("button", { name: "Go back" }));
    expect(mocks.navigate).toHaveBeenNthCalledWith(1, "/");
    expect(mocks.navigate).toHaveBeenNthCalledWith(2, -1);
  });
});
