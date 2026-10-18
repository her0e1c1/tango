import "@/test/mockFirestorePersistence";
vi.mock("@/entities/auth/@x/study-session", () => ({ getAuthUid: () => mocks.uid }));
import { setStudySessionIndex } from "@/entities/study-session";
import type { Preferences } from "@/entities/preference";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, Link, MemoryRouter, Route, RouterProvider, Routes, useLoaderData } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { createCard } from "@/entities/card";
import { createDeck, deleteDeck } from "@/entities/deck";
import { clearStudySessions, getStudySession } from "@/entities/study-session";
import { startStudy } from "@/test/utils/entityFixtures";
import { actAsync } from "@/test/act";
import { ToastViewport } from "@/shared/ui/toast";
import { dismissToast } from "@/test/utils/toast";
import { createLocalCard, createLocalDeck, createPreferences } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  deleteDeck: vi.fn(),
  downloadTextFile: vi.fn(),
  preferences: null as unknown as Preferences,
  setDarkMode: vi.fn(),
  uid: "user-id",
}));

vi.mock("@/entities/auth", () => ({ getAuthUid: () => mocks.uid }));
vi.mock("@/entities/deck", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/entities/deck")>();
  mocks.deleteDeck.mockImplementation(original.deleteDeck);

  return { ...original, deleteDeck: mocks.deleteDeck };
});
vi.mock("@/entities/preference", () => ({
  usePreferences: () => mocks.preferences,
  setDarkMode: mocks.setDarkMode,
}));
vi.mock("../model/actions/bootstrapSampleDeck", () => ({ bootstrapSampleDeck: () => undefined }));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/shared/files", () => ({ downloadTextFile: mocks.downloadTextFile }));

import { DeckListPage } from "./DeckListPage";

const StudyDestination = () => {
  const session = useLoaderData<ReturnType<typeof getStudySession>>();
  return (
    <main>
      <h1>Study destination</h1>
      <p>Current card: {session?.cardOrderIds[session.currentIndex]}</p>
      <p>Last studied: {session?.lastStudiedAt}</p>
      <Link to="/">Back to decks</Link>
    </main>
  );
};

describe("NAVIGATION-17 NAVIGATION-02 NAVIGATION-06 DECK-MANAGEMENT-02 DECK-MANAGEMENT-03 DECK-MANAGEMENT-04 DECK-TRANSFER-01 NAVIGATION-08 STUDY-SESSION-03 DeckListPage", () => {
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
            <Route path="/deck/:id/view" element={<h1>Deck view destination</h1>} />
            <Route path="/deck/:id/edit" element={<h1>Deck editor destination</h1>} />
          </Routes>
        </MemoryRouter>
        <ToastViewport />
      </>
    );

  beforeEach(async () => {
    // Given: Establish the shared setup used by the following cases.
    dismissToast();
    clearStudySessions();
    mocks.deleteDeck.mockClear();
    mocks.downloadTextFile.mockReset();
    mocks.preferences = createPreferences({ appearance: { darkMode: false } });
    mocks.setDarkMode.mockReset();
    mocks.uid = "user-id";
    await createDeck("user-id", activeDeck);
    await createDeck("user-id", freshDeck);
    await createCard("user-id", activeCard);
    await createCard("user-id", freshCard);
    startStudy(activeDeck.id, [activeCard], mocks.preferences.study, mocks.uid);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows held-data counts and opens Study new without replacing an active session", async () => {
    // Given: Prepare `session` and any shared test state below.
    mocks.preferences = createPreferences({ useCardInterval: true });
    const session = getStudySession(activeDeck.id);
    renderPage();
    expect(screen.getByText("0 due · 2 new")).toBeVisible();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByText("About counts"));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("Counts use data currently held on this device and saved filters.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Continue Active deck" })).toBeVisible();
    expect(screen.getByText("Studying · Card 1 of 1")).toBeVisible();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Study new cards in Fresh deck" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("heading", { name: "Study start destination" })).toBeVisible();
    expect(getStudySession(freshDeck.id)).toBeUndefined();
    expect(getStudySession(activeDeck.id)).toEqual(session);
  });

  it("navigates from each visible Deck action", async () => {
    // Given: Prepare `view` and any shared test state below.
    let view = renderPage();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Open cards in Active deck" }));
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { level: 1, name: "Card list destination" })).toBeVisible();

    // When: Exercise `view.unmount` with the prepared inputs.
    view.unmount();
    view = renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Continue Active deck" }));
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { level: 1, name: "Study destination" })).toBeVisible();

    // When: Exercise `view.unmount` with the prepared inputs.
    view.unmount();
    view = renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Study Fresh deck" }));
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { level: 1, name: "Study start destination" })).toBeVisible();

    // When: Exercise `view.unmount` with the prepared inputs.
    view.unmount();
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Open actions for Fresh deck" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { level: 1, name: "Deck editor destination" })).toBeVisible();
  });

  it.each([
    ["View cards in Active deck", "Deck view destination"],
    ["View cards in Fresh deck", "Deck view destination"],
    ["Create deck", "Deck creator destination"],
    ["Import decks", "Import destination"],
  ])("navigates from the %s list action", async (label, destination) => {
    // Given: Use this case's inputs and any shared test setup.
    renderPage();

    // When: Exercise `userEvent.click` with the prepared inputs.
    if (label.startsWith("View cards")) {
      await userEvent.click(
        screen.getByRole("button", { name: `Open actions for ${label.replace("View cards in ", "")}` })
      );
      await userEvent.click(screen.getByRole("menuitem", { name: "View" }));
    } else {
      await userEvent.click(screen.getByRole("button", { name: "Add" }));
      await userEvent.click(screen.getByRole("menuitem", { name: label }));
    }

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { level: 1, name: destination })).toBeVisible();
  });

  it.each(["latest-user", ""])("rejects deleting a Deck after identity changes at confirmation (%s)", async (uid) => {
    // Given: Prepare `trigger` and any shared test state below.
    renderPage();

    const trigger = screen.getByRole("button", { name: "Open actions for Fresh deck" });
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Open cards in Fresh deck" })).toBeVisible();
    expect(trigger).toHaveFocus();

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    mocks.uid = uid;
    await userEvent.click(screen.getByRole("button", { name: "Delete deck" }));

    // Then: Verify the expected result in the assertions below.
    expect(mocks.deleteDeck).not.toHaveBeenCalled();
    expect(await screen.findByRole("alert")).toBeVisible();
    expect(screen.getByRole("button", { name: "Open cards in Fresh deck" })).toBeVisible();
  });

  it("refreshes recency before Continue navigates while preserving the current card", async () => {
    // Given: Prepare `nextCard`, `now`, `router` and any shared test state below.
    const nextCard = createLocalCard({ id: "next-card", deckId: activeDeck.id, uniqueKey: "next-card" });
    await createCard("user-id", nextCard);
    const now = vi.spyOn(Date, "now").mockReturnValue(1000);
    startStudy(activeDeck.id, [activeCard, nextCard], { ...mocks.preferences.study, shuffled: false }, mocks.uid);
    void setStudySessionIndex(activeDeck.id, 1);
    now.mockReturnValue(2000);
    startStudy(freshDeck.id, [freshCard], mocks.preferences.study, mocks.uid);
    const router = createMemoryRouter([
      { path: "/", element: <DeckListPage /> },
      {
        path: "/deck/:id/study",
        loader: () => getStudySession(activeDeck.id),
        element: <StudyDestination />,
      },
    ]);
    render(<RouterProvider router={router} />);
    expect(
      screen.getAllByRole("button", { name: /^Continue / }).map((button) => button.getAttribute("aria-label"))
    ).toEqual(["Continue Fresh deck", "Continue Active deck"]);

    now.mockReturnValue(3000);
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Continue Active deck" }));

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { name: "Study destination" })).toBeVisible();
    expect(screen.getByText("Current card: next-card")).toBeVisible();
    expect(screen.getByText("Last studied: 3000")).toBeVisible();

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("link", { name: "Back to decks" }));

    // Then: Verify the expected result in the assertions below.
    expect(
      screen.getAllByRole("button", { name: /^Continue / }).map((button) => button.getAttribute("aria-label"))
    ).toEqual(["Continue Active deck", "Continue Fresh deck"]);
  });

  it.each(["identity change", "unmount"])(
    "[STUDY-SESSION-03] cancels Continue navigation after a queued %s",
    async (change) => {
      // Given: Prepare `router`, `view` and any shared test state below.
      const router = createMemoryRouter([
        { path: "/", element: <DeckListPage /> },
        { path: "/deck/:id/study", element: <h1>Study destination</h1> },
      ]);
      const view = render(<RouterProvider router={router} />);
      queueMicrotask(() => {
        if (change === "identity change") mocks.uid = "other-user";
        else view.unmount();
      });
      // When: Exercise `fireEvent.click` with the prepared inputs.
      fireEvent.click(screen.getByRole("button", { name: "Continue Active deck" }));
      await actAsync(async () => {
        await Promise.resolve();
      });
      // Then: Verify the expected result in the assertions below.
      expect(router.state.location.pathname).toBe("/");
    }
  );

  it("downloads a visible Deck", async () => {
    // Given: Use this case's inputs and any shared test setup.
    renderPage();

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Open actions for Fresh deck" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Download" }));

    // Then: Verify the expected result in the assertions below.
    expect(mocks.downloadTextFile).toHaveBeenCalledExactlyOnceWith(
      expect.any(String),
      "Fresh deck.csv",
      "text/plain;charset=utf-8"
    );
  });

  it("closes a failed deletion and retries after reopening the same Deck", async () => {
    // Given: Use this case's inputs and any shared test setup.
    mocks.deleteDeck.mockRejectedValueOnce(new Error("delete failed"));
    renderPage();

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Open actions for Fresh deck" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete deck" }));

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByText("Unable to delete this deck. Check your connection and try again.")).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Unable to delete this deck. Check your connection and try again."
    );
    expect(screen.queryByRole("alertdialog", { name: "Delete deck?" })).not.toBeInTheDocument();

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Open actions for Fresh deck" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete deck" }));

    // Then: Verify the expected result in the assertions below.
    await waitFor(() => expect(screen.queryByRole("alertdialog", { name: "Delete deck?" })).not.toBeInTheDocument());
    expect(mocks.deleteDeck).toHaveBeenCalledTimes(2);
  });

  it("navigates from both route shortcuts", async () => {
    // Given: Prepare `view` and any shared test state below.
    const view = renderPage();
    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(window, { key: "s" });
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { level: 1, name: "Settings destination" })).toBeVisible();

    // When: Exercise `view.unmount` with the prepared inputs.
    view.unmount();
    renderPage();
    fireEvent.keyDown(window, { key: "i" });
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { level: 1, name: "Import destination" })).toBeVisible();
  });

  it("renders an empty list after all Decks are removed", async () => {
    // Given: Use this case's inputs and any shared test setup.
    mocks.preferences.loadSample = false;
    await deleteDeck("user-id", activeDeck.id);
    await deleteDeck("user-id", freshDeck.id);
    // When: Exercise `renderPage` with the prepared inputs.
    renderPage();

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("heading", { level: 1, name: "Decks" })).toBeVisible();
    expect(screen.getByText("0 decks")).toBeVisible();
    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();
    expect(screen.getByRole("heading", { level: 2, name: "No decks yet" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Create deck" })).toBeVisible();
  });
});
