import type { Preferences } from "@/entities/preference";

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { createDeck } from "@/entities/deck";
import { dismissToast, ToastViewport } from "@/shared/ui/toast";
import { actAsync } from "@/test/act";
import { createLocalDeck, createPreferences } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  preferences: null as unknown as Preferences,
  setDarkMode: vi.fn(),
}));

vi.mock("@/entities/auth", () => ({ useAuthUid: () => "user-id" }));
vi.mock("@/entities/preference", () => ({
  usePreferences: () => mocks.preferences,
  setDarkMode: mocks.setDarkMode,
}));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { DeckFormPage } from "./DeckFormPage";

describe("DeckFormPage", () => {
  const deckId = "deck-id";
  const renderPage = (path = `/deck/${deckId}/edit`) =>
    render(
      <>
        <MemoryRouter initialEntries={["/previous", path]} initialIndex={1}>
          <Routes>
            <Route path="/previous" element={<h1>Previous page</h1>} />
            <Route path="/" element={<h1>Deck list</h1>} />
            <Route path="/deck/:id/edit" element={<DeckFormPage />} />
          </Routes>
        </MemoryRouter>
        <ToastViewport />
      </>
    );

  beforeEach(async () => {
    dismissToast();
    mocks.preferences = createPreferences({ appearance: { darkMode: false } });
    mocks.setDarkMode.mockReset();
    await createDeck("", createLocalDeck({ id: deckId, name: "Deck name", category: "", convertToBr: false }));
  });

  it("renders the stored deck editor in the application shell", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "Deck name" })).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Deck name");
    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();
  });

  it("initializes the editor when the route Deck arrives after mount", async () => {
    const delayedDeckId = "delayed-deck";
    renderPage(`/deck/${delayedDeckId}/edit`);

    expect(screen.getByRole("heading", { level: 1, name: "Deck not found" })).toBeVisible();
    await actAsync(async () => {
      await createDeck("", createLocalDeck({ id: delayedDeckId, name: "Delayed deck" }));
    });

    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Delayed deck");
  });

  it("resets page-owned state when navigating to a different Deck", async () => {
    const nextDeckId = "next-deck";
    await createDeck("", createLocalDeck({ id: nextDeckId, name: "Next deck" }));
    render(
      <MemoryRouter initialEntries={[`/deck/${deckId}/edit`]}>
        <Link to={`/deck/${nextDeckId}/edit`}>Next deck</Link>
        <Routes>
          <Route path="/deck/:id/edit" element={<DeckFormPage />} />
        </Routes>
      </MemoryRouter>
    );

    await userEvent.click(screen.getByRole("button", { name: "Delete deck" }));
    expect(screen.getByRole("alertdialog", { name: "Delete deck?" })).toHaveTextContent("Deck name");

    await userEvent.click(screen.getByRole("link", { name: "Next deck" }));

    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Next deck");
    expect(screen.queryByRole("alertdialog", { name: "Delete deck?" })).not.toBeInTheDocument();
  });

  it("navigates to the deck list after saving", async () => {
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Deck list" })).toBeVisible();
    expect(screen.getByText("Updated deck “Deck name”.")).toBeVisible();
  });

  it("navigates to the deck list after cancellation", async () => {
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Deck list" })).toBeVisible();
  });

  it("deletes the deck from its settings page after confirmation", async () => {
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Delete deck" }));
    const dialog = screen.getByRole("alertdialog", { name: "Delete deck?" });
    expect(dialog).toHaveTextContent("Deck name");
    expect(dialog).toHaveTextContent("This permanently deletes 0 cards in this deck.");

    await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("heading", { level: 1, name: "Deck name" })).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Delete deck" }));
    await userEvent.click(
      within(screen.getByRole("alertdialog", { name: "Delete deck?" })).getByRole("button", { name: "Delete deck" })
    );

    expect(await screen.findByRole("heading", { level: 1, name: "Deck list" })).toBeVisible();
    expect(screen.getByText("Deleted deck “Deck name”.")).toBeVisible();
  });

  it("navigates with both recovery actions when the deck is unavailable", async () => {
    const view = renderPage("/deck/missing-deck/edit");

    expect(screen.getByRole("heading", { level: 1, name: "Deck not found" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "tango" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Go home" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Deck list" })).toBeVisible();

    view.unmount();
    renderPage("/deck/missing-deck/edit");
    await userEvent.click(screen.getByRole("button", { name: "Go back" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Previous page" })).toBeVisible();
  });

  it("rejects a route without a deck id", () => {
    expect(() =>
      render(
        <MemoryRouter>
          <DeckFormPage />
        </MemoryRouter>
      )
    ).toThrowError("invalid deck id");
  });
});
