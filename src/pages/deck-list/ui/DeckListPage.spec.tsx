import type { Preferences } from "@/entities/preference";

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { mutateCards } from "@/entities/card";
import { createDeck, deleteDeck } from "@/entities/deck";
import { clearStudySessions, startStudy } from "@/entities/study-session";
import { dismissToast, ToastViewport } from "@/shared/ui/toast";
import { actAsync } from "@/test/act";
import { createLocalCard, createLocalDeck, createPreferences } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  deleteDeck: vi.fn(),
  downloadTextFile: vi.fn(),
  preferences: null as unknown as Preferences,
  setDarkMode: vi.fn(),
}));

vi.mock("@/entities/auth", () => ({ useAuthUid: () => "user-id" }));
vi.mock("@/entities/deck", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/entities/deck")>();
  mocks.deleteDeck.mockImplementation(original.deleteDeck);

  return { ...original, deleteDeck: mocks.deleteDeck };
});
vi.mock("@/entities/preference", () => ({
  usePreferences: () => mocks.preferences,
  setDarkMode: mocks.setDarkMode,
}));
vi.mock("@/features/sample-import", () => ({ useAddSampleDeck: () => undefined }));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/shared/files", () => ({ downloadTextFile: mocks.downloadTextFile }));

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
      <>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<DeckListPage />} />
            <Route path="/deck/new" element={<h1>Deck creator destination</h1>} />
            <Route path="/settings" element={<h1>Settings destination</h1>} />
            <Route path="/import" element={<h1>Import destination</h1>} />
            <Route path="/deck/:id" element={<h1>Card list destination</h1>} />
            <Route path="/deck/:id/study" element={<h1>Study destination</h1>} />
            <Route path="/deck/:id/start" element={<h1>Study start destination</h1>} />
            <Route path="/deck/:id/edit" element={<h1>Deck editor destination</h1>} />
          </Routes>
        </MemoryRouter>
        <ToastViewport />
      </>
    );

  beforeEach(async () => {
    dismissToast();
    clearStudySessions();
    mocks.deleteDeck.mockClear();
    mocks.downloadTextFile.mockReset();
    mocks.preferences = createPreferences({ appearance: { darkMode: false } });
    mocks.setDarkMode.mockReset();
    await createDeck("", activeDeck);
    await createDeck("", freshDeck);
    await mutateCards("", [
      { kind: "create", card: activeCard },
      { kind: "create", card: freshCard },
    ]);
    startStudy(activeDeck.id, [activeCard], mocks.preferences.study);
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

  it("navigates to Deck creation", async () => {
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Create deck" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Deck creator destination" })).toBeVisible();
  });

  it("deletes a local Deck and reports the visible result", async () => {
    renderPage();

    const trigger = screen.getByRole("button", { name: "Open actions for Fresh deck" });
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByRole("button", { name: "View Fresh deck" })).toBeVisible();
    expect(trigger).toHaveFocus();

    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete deck" }));

    expect(mocks.deleteDeck).toHaveBeenCalledExactlyOnceWith("user-id", freshDeck.id);
    expect(await screen.findByText("Deleted deck “Fresh deck”.")).toBeVisible();
    await waitFor(() => expect(screen.queryByRole("button", { name: "View Fresh deck" })).not.toBeInTheDocument());
  });

  it("downloads a visible Deck", async () => {
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Open actions for Fresh deck" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Download" }));

    expect(mocks.downloadTextFile).toHaveBeenCalledExactlyOnceWith(
      expect.any(String),
      "Fresh deck.csv",
      "text/plain;charset=utf-8"
    );
  });

  it("keeps a failed deletion available for retry", async () => {
    mocks.deleteDeck.mockRejectedValueOnce(new Error("delete failed"));
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Open actions for Fresh deck" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete deck" }));

    const dialog = screen.getByRole("alertdialog", { name: "Delete deck?" });
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Unable to delete this deck. Check your connection and try again."
    );
    expect(within(dialog).queryByRole("button", { name: "Dismiss notification" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Delete deck" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog", { name: "Delete deck?" })).not.toBeInTheDocument());
    expect(mocks.deleteDeck).toHaveBeenCalledTimes(2);
  });

  it("locks cancellation while deletion persistence is pending", async () => {
    const request = Promise.withResolvers<void>();
    mocks.deleteDeck.mockReturnValueOnce(request.promise);
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Open actions for Fresh deck" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete deck" }));

    const dialog = screen.getByRole("alertdialog", { name: "Delete deck?" });
    expect(dialog).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(dialog).toBeVisible();

    await actAsync(async () => {
      request.resolve();
      await request.promise;
    });
    await waitFor(() => expect(screen.queryByRole("alertdialog", { name: "Delete deck?" })).not.toBeInTheDocument());
  });

  it("dismisses a deletion error when the dialog is cancelled", async () => {
    mocks.deleteDeck.mockRejectedValueOnce(new Error("delete failed"));
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Open actions for Fresh deck" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete deck" }));
    expect(await screen.findByText("Unable to delete this deck. Check your connection and try again.")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("alertdialog", { name: "Delete deck?" })).not.toBeInTheDocument();
    expect(
      screen.queryByText("Unable to delete this deck. Check your connection and try again.")
    ).not.toBeInTheDocument();
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
    await deleteDeck("", activeDeck.id);
    await deleteDeck("", freshDeck.id);
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
    expect(screen.getByText("0 decks")).toBeVisible();
    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();
  });
});
