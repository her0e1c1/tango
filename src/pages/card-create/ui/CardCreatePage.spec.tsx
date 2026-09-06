import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { createDeck } from "@/entities/deck";
import { dismissToast, ToastViewport } from "@/shared/ui/toast";
import { createLocalDeck } from "@/test/factories";

const writes = vi.hoisted(() => ({ rejected: false }));

vi.mock("@/entities/auth", () => ({ useAuthUid: () => "user-id" }));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/entities/card", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/entities/card")>();
  return {
    ...original,
    createCard: async (...args: Parameters<typeof original.createCard>) => {
      if (writes.rejected) throw new Error("write rejected");
      await original.createCard(...args);
    },
  };
});

import { CardCreatePage } from "./CardCreatePage";

describe("CARD-13 CARD-14 CARD-15 CardCreatePage", () => {
  const deck = createLocalDeck({ id: "target-deck", name: "Target deck" });
  const renderPage = (deckId = deck.id) =>
    render(
      <>
        <MemoryRouter initialEntries={[`/deck/${deckId}/card/new`]}>
          <Routes>
            <Route path="/deck/:id/card/new" element={<CardCreatePage />} />
            <Route path="/deck/:id" element={<h1>Card list destination</h1>} />
          </Routes>
        </MemoryRouter>
        <ToastViewport />
      </>
    );

  beforeEach(async () => {
    dismissToast();
    writes.rejected = false;
    await createDeck("", deck);
  });

  it("shows the target Deck context and cancels to its Card list", async () => {
    renderPage();

    expect(screen.getByText("Add a card to Target deck.")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Card list destination" })).toBeVisible();
  });

  it("creates a Card and keeps its success notification across navigation", async () => {
    renderPage();

    await userEvent.type(screen.getByRole("textbox", { name: "Front text" }), "Created front");
    await userEvent.click(screen.getByRole("tab", { name: "Back" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Back text" }), "Created back");
    await userEvent.click(screen.getByRole("button", { name: "Create card" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Card list destination" })).toBeVisible();
    expect(screen.getByText("Created card “Created front”.")).toBeVisible();
  });

  it("shows route recovery when the target Deck is unavailable", () => {
    renderPage("missing-deck");

    expect(screen.getByRole("heading", { level: 1, name: "Deck not found" })).toBeVisible();
  });

  it("stays on the creation Page with both inputs when saving fails", async () => {
    writes.rejected = true;
    renderPage();
    await userEvent.type(screen.getByRole("textbox", { name: "Front text" }), "Retained front");
    await userEvent.click(screen.getByRole("tab", { name: "Back" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Back text" }), "Retained back");

    await userEvent.click(screen.getByRole("button", { name: "Create card" }));

    expect(await screen.findByText("Unable to create this card. Try again.")).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Card list destination" })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Back text" })).toHaveValue("Retained back");
    await userEvent.click(screen.getByRole("tab", { name: "Front" }));
    expect(screen.getByRole("textbox", { name: "Front text" })).toHaveValue("Retained front");
    expect(screen.getByRole("button", { name: "Create card" })).toBeEnabled();
  });
});
