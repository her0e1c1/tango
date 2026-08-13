/**
 * @file Verifies the "CardFormPage" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "submits the current card",
 * "returns to the previous page without saving when cancelled", "submits edited front and back
 * text".
 */

import type { Card } from "@/entities/card";
import type { ConfigState } from "@/shared/config";

import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { createConfig } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  params: { id: "card-id" as string | undefined },
  config: null as unknown as ConfigState,
  card: null as Card | null,
  cardUpdate: vi.fn(),
  navigate: vi.fn(),
  setDarkMode: vi.fn(),
}));

vi.mock("@/shared/config", () => ({
  useConfig: () => mocks.config,
  setDarkMode: mocks.setDarkMode,
}));

vi.mock("@/entities/card", () => ({
  useCards: () => ({
    status: "ready" as const,
    retry: vi.fn(),
    cardsById: mocks.card == null ? {} : { [mocks.card.id]: mocks.card },
  }),
}));

vi.mock("react-router-dom", () => ({
  useParams: () => mocks.params,
  useNavigate: () => mocks.navigate,
}));

vi.mock("@/shared/firebase", () => ({ auth: {} }));

vi.mock("@/features/card/edit", () => ({
  useEditCard: () => ({
    update: mocks.cardUpdate,
  }),
}));

import { CardFormPage } from "./CardFormPage";

describe("CardFormPage", () => {
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
    mocks.config = createConfig({ appearance: { darkMode: false } });
    mocks.cardUpdate.mockReset();
    mocks.cardUpdate.mockResolvedValue(undefined);
    mocks.navigate.mockReset();
    mocks.setDarkMode.mockReset();
  });

  it("submits the current card", async () => {
    render(<CardFormPage />);

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(mocks.cardUpdate).toHaveBeenCalledWith(card);
    expect(mocks.navigate).toHaveBeenCalledWith(-1);
  });

  it("renders the ready screen in the application shell", () => {
    render(<CardFormPage />);

    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();
  });

  it("returns to the previous page without saving when cancelled", async () => {
    render(<CardFormPage />);

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(mocks.cardUpdate).not.toHaveBeenCalled();
    expect(mocks.navigate).toHaveBeenCalledWith(-1);
  });

  it("submits edited front and back text", async () => {
    render(<CardFormPage />);
    const frontText = screen.getByRole("textbox", { name: "Front text" });
    const backText = screen.getByRole("textbox", { name: "Back text" });

    await userEvent.clear(frontText);
    await userEvent.type(frontText, " UPDATED FRONT ");
    await userEvent.clear(backText);
    await userEvent.type(backText, " UPDATED BACK ");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(mocks.cardUpdate).toHaveBeenCalledWith({
      ...card,
      frontText: " UPDATED FRONT ",
      backText: " UPDATED BACK ",
    });
  });

  it("submits edited tags", async () => {
    render(<CardFormPage />);

    await userEvent.click(screen.getByRole("checkbox", { name: /^math$/i }));
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(mocks.cardUpdate).toHaveBeenCalledWith({ ...card, tags: ["math"] });
  });

  it("blocks blank front and back text", async () => {
    render(<CardFormPage />);
    const frontText = screen.getByRole("textbox", { name: "Front text" });
    const backText = screen.getByRole("textbox", { name: "Back text" });

    await userEvent.clear(frontText);
    await userEvent.type(frontText, "   ");
    await userEvent.clear(backText);
    await userEvent.type(backText, "   ");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(screen.getByText("Front text is required.")).toBeInTheDocument();
    expect(screen.getByText("Back text is required.")).toBeInTheDocument();
    expect(frontText).toHaveAttribute("aria-invalid", "true");
    expect(backText).toHaveAttribute("aria-invalid", "true");
    expect(mocks.cardUpdate).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("does not navigate when the Card write fails", async () => {
    mocks.cardUpdate.mockRejectedValueOnce(new Error("write failed"));
    render(<CardFormPage />);

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(mocks.cardUpdate).toHaveBeenCalledWith(card);
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("Unable to save changes. Try again.");
  });

  it("shows recovery actions when the card is unavailable", () => {
    mocks.card = null;
    render(<CardFormPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Card not found" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go home" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go back" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "tango" })).not.toBeInTheDocument();
  });

  it("goes home when card recovery is requested", async () => {
    mocks.card = null;
    render(<CardFormPage />);

    await userEvent.click(screen.getByRole("button", { name: "Go home" }));

    expect(mocks.navigate).toHaveBeenCalledWith("/");
  });

  it("goes back when card recovery is requested", async () => {
    mocks.card = null;
    render(<CardFormPage />);

    await userEvent.click(screen.getByRole("button", { name: "Go back" }));

    expect(mocks.navigate).toHaveBeenCalledWith(-1);
  });

  it("preserves the invalid route error", () => {
    mocks.params.id = undefined;

    expect(() => render(<CardFormPage />)).toThrowError("invalid card id");
  });
});
