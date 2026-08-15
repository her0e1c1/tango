import type { Deck } from "@/entities/deck";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { createDeck } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  params: { id: "deck-id" as string | undefined },
  deck: null as Deck | null,
  navigate: vi.fn(),
}));

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  auth: {},
  db: {},
}));

vi.mock("@/entities/deck", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/deck")>();
  return {
    ...actual,
    useDeck: () => mocks.deck ?? undefined,
  };
});
vi.mock("@/features/deck-edit", () => ({
  DeckEditForm: (props: { deck: Deck; onCancel: () => void; onSaved: () => void }) => (
    <section>
      <h1>{props.deck.name}</h1>
      <button type="button" onClick={props.onSaved}>
        Save changes
      </button>
      <button type="button" onClick={props.onCancel}>
        Cancel
      </button>
    </section>
  ),
}));

vi.mock("react-router-dom", () => ({
  useParams: () => mocks.params,
  useNavigate: () => mocks.navigate,
}));

import { DeckFormPage } from "./DeckFormPage";

describe("DeckFormPage", () => {
  const deck = createDeck({ id: "deck-id", name: "Deck name", url: "", category: "", convertToBr: false });

  beforeEach(() => {
    mocks.params.id = deck.id;
    mocks.deck = deck;
    vi.clearAllMocks();
  });

  it("composes the route, application shell, and deck editor", () => {
    render(<DeckFormPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Deck name" })).toBeVisible();
    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();
  });

  it("owns navigation after saving", async () => {
    render(<DeckFormPage />);
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(mocks.navigate).toHaveBeenCalledWith("/", { replace: true });
  });

  it("owns cancellation navigation", async () => {
    render(<DeckFormPage />);

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(mocks.navigate).toHaveBeenCalledWith("/", { replace: true });
  });

  it("renders missing-deck recovery outside the application shell", () => {
    mocks.deck = null;
    render(<DeckFormPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Deck not found" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "tango" })).not.toBeInTheDocument();
  });

  it("rejects a route without a deck id", () => {
    mocks.params.id = undefined;
    expect(() => render(<DeckFormPage />)).toThrowError("invalid deck id");
  });
});
