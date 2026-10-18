import "@/test/mockFirestorePersistence";
import type { Preferences } from "@/entities/preference";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { createCard } from "@/entities/card";
import { createDeck } from "@/entities/deck";
import { createLocalCard, createLocalDeck, createPreferences } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  preferences: null as unknown as Preferences,
  setDarkMode: vi.fn(),
}));

vi.mock("@/entities/auth", () => ({ useAuth: () => ({ uid: "user-id" }) }));
vi.mock("@/entities/preference", () => ({
  usePreferences: () => mocks.preferences,
  setDarkMode: mocks.setDarkMode,
}));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { CardListPage } from "./CardListPage";

const NextDeckButton = () => {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => void navigate("/deck/next-deck")}>
      Open next deck
    </button>
  );
};

describe("NAVIGATION-02 NAVIGATION-07 CARD-VIEW-01 CARD-LIST-ACTIONS-01 CARD-MANAGEMENT-05 CARD-LIST-ACTIONS-03 CardListPage", () => {
  const deckId = "deck-id";
  const nextDeckId = "next-deck";
  const cardId = "card-id";
  const nextCardId = "next-card";
  const renderPage = (path = `/deck/${deckId}`) =>
    render(
      <MemoryRouter initialEntries={["/previous", path]} initialIndex={1}>
        <NextDeckButton />
        <Routes>
          <Route path="/previous" element={<h1>Previous page</h1>} />
          <Route path="/" element={<h1>Deck list destination</h1>} />
          <Route path="/settings" element={<h1>Settings destination</h1>} />
          <Route path="/card/:id/edit" element={<h1>Card editor destination</h1>} />
          <Route path="/deck/:id/card/new" element={<h1>Card creator destination</h1>} />
          <Route path="/deck/:id" element={<CardListPage />} />
        </Routes>
      </MemoryRouter>
    );

  beforeEach(async () => {
    // Given: Establish the shared setup used by the following cases.
    mocks.preferences = createPreferences();
    mocks.setDarkMode.mockReset();
    await createDeck(
      "user-id",
      createLocalDeck({
        id: deckId,
        name: "First deck",
        cardFilter: { selectedTags: ["typescript"], tagAndFilter: false },
      })
    );
    await createDeck("user-id", createLocalDeck({ id: nextDeckId, name: "Next deck" }));
    await createCard(
      "user-id",
      createLocalCard({
        id: cardId,
        deckId,
        frontText: "Front one",
        backText: "Back one",
        tags: ["typescript"],
        uniqueKey: "card-one",
      })
    );
    await createCard(
      "user-id",
      createLocalCard({
        id: nextCardId,
        deckId: nextDeckId,
        frontText: "Front two",
        backText: "Back two",
        uniqueKey: "card-two",
      })
    );
  });

  it("renders stored cards and navigates to the selected card editor", async () => {
    // Given: Use this case's inputs and any shared test setup.
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "Cards" })).toBeVisible();
    expect(screen.getByRole("button", { name: "View Front one" })).toBeVisible();
    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Open actions for Front one" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { level: 1, name: "Card editor destination" })).toBeVisible();
  });

  it("navigates to Card creation for the current Deck", async () => {
    // Given: Use this case's inputs and any shared test setup.
    renderPage();

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Add card" }));

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { level: 1, name: "Card creator destination" })).toBeVisible();
  });

  it("removes a selected tag from the visible filter", async () => {
    // Given: Use this case's inputs and any shared test setup.
    renderPage();

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Remove typescript filter" }));

    // Then: Verify the expected result in the assertions below.
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Remove typescript filter" })).not.toBeInTheDocument()
    );
    expect(screen.getByText("No filters")).toBeVisible();
  });

  it("uses the shared progressive tag filter", async () => {
    // Given: Use this case's inputs and any shared test setup.
    await Promise.all(
      Array.from({ length: 12 }, (_, index) => {
        const suffix = String(index + 1).padStart(2, "0");
        return createCard(
          "user-id",
          createLocalCard({
            id: `tag-card-${suffix}`,
            deckId,
            frontText: `Tagged card ${suffix}`,
            tags: [`tag-${suffix}`],
            uniqueKey: `tag-card-${suffix}`,
          })
        );
      })
    );
    renderPage();

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByText("Filters"));

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("checkbox", { name: "typescript" })).toBeChecked();
    expect(screen.queryByRole("checkbox", { name: "tag-12" })).not.toBeInTheDocument();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Show 4 more tags" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("checkbox", { name: "tag-12" })).toBeVisible();
  });

  it("resets sorting on a Deck change and after leaving the Page", async () => {
    // Given: Prepare `view` and any shared test state below.
    const view = renderPage();
    // When: Exercise `userEvent.selectOptions` with the prepared inputs.
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Sort order" }), "newest");
    await userEvent.click(screen.getByRole("button", { name: "Open next deck" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("combobox", { name: "Sort order" })).toHaveValue("standard");
    // When: Exercise `userEvent.selectOptions` with the prepared inputs.
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Sort order" }), "newest");
    view.unmount();
    renderPage();
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("combobox", { name: "Sort order" })).toHaveValue("standard");
  });

  it("navigates from both route shortcuts", async () => {
    // Given: Prepare `view` and any shared test state below.
    const view = renderPage();
    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(window, { key: "t" });
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { level: 1, name: "Deck list destination" })).toBeVisible();

    // When: Exercise `view.unmount` with the prepared inputs.
    view.unmount();
    renderPage();
    fireEvent.keyDown(window, { key: "s" });
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { level: 1, name: "Settings destination" })).toBeVisible();
  });

  it("resets the shown card when navigation changes the route deck", async () => {
    // Given: Use this case's inputs and any shared test setup.
    renderPage();

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "View Front one" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByLabelText("Close card")).toHaveTextContent("Back one");

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Open next deck" }));

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("button", { name: "View Front two" })).toBeVisible();
    expect(screen.queryByLabelText("Close card")).not.toBeInTheDocument();
  });

  it("navigates with both recovery actions when the deck is unavailable", async () => {
    // Given: Prepare `view` and any shared test state below.
    const view = renderPage("/deck/missing-deck");

    expect(screen.getByRole("heading", { name: "Deck not found" })).toBeVisible();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Go home" }));
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { level: 1, name: "Deck list destination" })).toBeVisible();

    // When: Exercise `view.unmount` with the prepared inputs.
    view.unmount();
    renderPage("/deck/missing-deck");
    await userEvent.click(screen.getByRole("button", { name: "Go back" }));
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { level: 1, name: "Previous page" })).toBeVisible();
  });

  it("renders empty recovery when deck has no cards and navigates to card creator", async () => {
    // Given: Prepare `emptyDeckId` and any shared test state below.
    const emptyDeckId = "empty-deck-id";
    await createDeck("user-id", createLocalDeck({ id: emptyDeckId, name: "Empty deck" }));
    renderPage(`/deck/${emptyDeckId}`);

    expect(await screen.findByRole("heading", { level: 2, name: "No cards yet" })).toBeVisible();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Add card" }));
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { level: 1, name: "Card creator destination" })).toBeVisible();
  });

  it("renders filter-zero recovery and clears filters when cards match zero", async () => {
    // Given: Prepare `filteredDeckId` and any shared test state below.
    const filteredDeckId = "filtered-deck-id";
    await createDeck(
      "user-id",
      createLocalDeck({
        id: filteredDeckId,
        name: "Filtered deck",
        cardFilter: { selectedTags: ["missing"], tagAndFilter: true },
      })
    );
    await createCard(
      "user-id",
      createLocalCard({
        id: "card-diff-8",
        deckId: filteredDeckId,
        frontText: "High diff",
        tags: ["react"],
        uniqueKey: "card-diff-8",
      })
    );

    renderPage(`/deck/${filteredDeckId}`);

    expect(await screen.findByRole("heading", { level: 2, name: "No cards match the active filters" })).toBeVisible();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("button", { name: "View High diff" })).toBeVisible();
  });

  it("rejects a route without a deck id", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Evaluate `render` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    expect(() =>
      render(
        <MemoryRouter>
          <CardListPage />
        </MemoryRouter>
      )
    ).toThrowError("invalid deck id");
  });
});
