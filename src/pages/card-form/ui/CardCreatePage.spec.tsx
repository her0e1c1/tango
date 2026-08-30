import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { createDeck } from "@/entities/deck";
import { createLocalDeck } from "@/test/factories";

vi.mock("@/entities/auth", () => ({ useAuthUid: () => "user-id" }));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { CardCreatePage } from "./CardCreatePage";

describe("CardCreatePage", () => {
  const deck = createLocalDeck({ id: "target-deck", name: "Target deck" });
  const renderPage = (deckId = deck.id) =>
    render(
      <MemoryRouter initialEntries={[`/deck/${deckId}/card/new`]}>
        <Routes>
          <Route path="/deck/:id/card/new" element={<CardCreatePage />} />
          <Route path="/deck/:id" element={<h1>Card list destination</h1>} />
        </Routes>
      </MemoryRouter>
    );

  beforeEach(async () => {
    await createDeck("", deck);
  });

  it("shows the target Deck context and cancels to its Card list", async () => {
    renderPage();

    expect(screen.getByText("Add a card to Target deck.")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Card list destination" })).toBeVisible();
  });

  it("shows route recovery when the target Deck is unavailable", () => {
    renderPage("missing-deck");

    expect(screen.getByRole("heading", { level: 1, name: "Deck not found" })).toBeVisible();
  });
});
