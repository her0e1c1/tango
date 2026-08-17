import type { Preferences } from "@/entities/preferences";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { mutateCards } from "@/entities/card";
import { createDeck, deleteDeck } from "@/entities/deck";
import { clearStudySessions, startStudy } from "@/entities/study-session";
import { createLocalCard, createLocalDeck, createPreferences, createStudyProgress } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  preferences: null as unknown as Preferences,
  setDarkMode: vi.fn(),
}));

vi.mock("@/entities/auth", () => ({ useAuthUid: () => "user-id" }));
vi.mock("@/entities/preferences", () => ({
  usePreferences: () => mocks.preferences,
  setDarkMode: mocks.setDarkMode,
}));
vi.mock("@/features/deck-import", () => ({ useAddSampleDeck: () => undefined }));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { DeckListPage } from "./DeckListPage";

describe("DeckListPage", () => {
  const activeDeck = createLocalDeck({ id: "active-deck", name: "Active deck" });
  const freshDeck = createLocalDeck({ id: "fresh-deck", name: "Fresh deck" });
  const activeCard = createLocalCard({
    id: "active-card",
    deckId: activeDeck.id,
    frontText: "Active front",
    uniqueKey: "active-card",
  });
  const freshCard = createLocalCard({
    id: "fresh-card",
    deckId: freshDeck.id,
    frontText: "Fresh front",
    uniqueKey: "fresh-card",
  });
  const renderPage = () =>
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<DeckListPage />} />
          <Route path="/settings" element={<h1>Settings destination</h1>} />
          <Route path="/import" element={<h1>Import destination</h1>} />
          <Route path="/deck/:id" element={<h1>Card list destination</h1>} />
          <Route path="/deck/:id/study" element={<h1>Study destination</h1>} />
          <Route path="/deck/:id/start" element={<h1>Study start destination</h1>} />
          <Route path="/deck/:id/edit" element={<h1>Deck editor destination</h1>} />
        </Routes>
      </MemoryRouter>
    );

  beforeEach(async () => {
    clearStudySessions();
    mocks.preferences = createPreferences({ appearance: { darkMode: false } });
    mocks.setDarkMode.mockReset();
    await createDeck("", activeDeck);
    await createDeck("", freshDeck);
    await mutateCards("", [
      { kind: "create", card: activeCard },
      { kind: "create", card: freshCard },
    ]);
    startStudy(activeDeck.id, [createStudyProgress({ cardId: activeCard.id })], mocks.preferences.study);
  });

  it("navigates from each visible Deck action", async () => {
    let view = renderPage();
    await userEvent.click(screen.getByRole("button", { name: "View Active deck" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Card list destination" })).toBeVisible();

    view.unmount();
    view = renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Continue Active deck" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Study destination" })).toBeVisible();

    view.unmount();
    view = renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Study Fresh deck" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Study start destination" })).toBeVisible();

    view.unmount();
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Open actions for Fresh deck" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Deck editor destination" })).toBeVisible();
  });

  it("deletes a local Deck and reports the visible result", async () => {
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Open actions for Fresh deck" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete deck" }));

    expect(await screen.findByText("Deleted deck “Fresh deck”.")).toBeVisible();
    await waitFor(() => expect(screen.queryByRole("button", { name: "View Fresh deck" })).not.toBeInTheDocument());
  });

  it("navigates from both route shortcuts", async () => {
    const view = renderPage();
    fireEvent.keyDown(window, { key: "s" });
    expect(await screen.findByRole("heading", { level: 1, name: "Settings destination" })).toBeVisible();

    view.unmount();
    renderPage();
    fireEvent.keyDown(window, { key: "i" });
    expect(await screen.findByRole("heading", { level: 1, name: "Import destination" })).toBeVisible();
  });

  it("renders an empty list after all Decks are removed", async () => {
    await deleteDeck("", activeDeck);
    await deleteDeck("", freshDeck);
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
    expect(screen.getByText("0 decks")).toBeVisible();
    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();
  });
});
