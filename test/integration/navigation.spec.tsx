import "@/test/mockFirestorePersistence";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "@/app/App";
import { appRoutes } from "@/app/routes";
import { replaceAuthSession } from "@/entities/auth";
import { createCard, getCards } from "@/entities/card";
import { createDeck, deleteDeck, getDecks } from "@/entities/deck";
import { updatePreferences } from "@/entities/preference";
import { createLocalCard, createLocalDeck, createPreferences } from "@/test/factories";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/app/auth", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/app/firestore-subscriptions", () => ({
  FirestoreSubscriptionsProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const cases = [
  { id: "plan", name: "Plain Deck", frontText: "Plain Card", path: "/deck/plan" },
  { id: "plan?draft=1", name: "Question mark Deck", frontText: "Question mark Card", path: "/deck/plan%3Fdraft%3D1" },
  { id: "plan#draft", name: "Hash Deck", frontText: "Hash Card", path: "/deck/plan%23draft" },
];

describe("NAVIGATION-06 Deck navigation through App, router, and local Entities", () => {
  beforeEach(async () => {
    // Given: Establish the shared setup used by the following cases.
    replaceAuthSession({ status: "authenticated", uid: "user-id", displayName: null, isAnonymous: true });
    updatePreferences(createPreferences({ loadSample: false }));
    for (const { id, name, frontText } of cases) {
      await createDeck("user-id", createLocalDeck({ id, name }));
      await createCard("user-id", createLocalCard({ id: `${id}-card`, deckId: id, frontText, uniqueKey: id }));
    }
  });

  afterEach(async () => {
    cleanup();
    for (const { id } of cases) await deleteDeck("user-id", id);
    replaceAuthSession({ status: "initializing" });
  });

  it.each(cases)("opens only $id Cards and preserves the destination on direct entry", async (selected) => {
    // Given: Prepare `decksBefore`, `cardsBefore`, `savedDecks` and any shared test state below.
    const decksBefore = structuredClone(getDecks());
    const cardsBefore = structuredClone(getCards());
    const savedDecks = localStorage.getItem("tango-local-decks");
    const savedCards = localStorage.getItem("tango-local-cards");
    const router = createMemoryRouter(appRoutes, { initialEntries: ["/"] });
    const view = render(<App router={router} />);

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: `Open cards in ${selected.name}` }));

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("button", { name: `View ${selected.frontText}` })).toBeVisible();
    expect(router.state.location).toMatchObject({ pathname: selected.path, search: "", hash: "" });
    for (const other of cases.filter(({ id }) => id !== selected.id)) {
      // Given: Use the current iteration or branch inputs from the enclosing case.
      // Then: Verify the expected result in the assertions below.
      expect(screen.queryByRole("button", { name: `View ${other.frontText}` })).not.toBeInTheDocument();
    }

    // When: Exercise `view.unmount` with the prepared inputs.
    view.unmount();
    router.dispose();
    const directRouter = createMemoryRouter(appRoutes, { initialEntries: [selected.path] });
    const directView = render(<App router={directRouter} />);
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("button", { name: `View ${selected.frontText}` })).toBeVisible();
    for (const other of cases.filter(({ id }) => id !== selected.id)) {
      // Given: Use the current iteration or branch inputs from the enclosing case.
      // Then: Verify the expected result in the assertions below.
      expect(screen.queryByRole("button", { name: `View ${other.frontText}` })).not.toBeInTheDocument();
    }
    expect(getDecks()).toEqual(decksBefore);
    expect(getCards()).toEqual(cardsBefore);
    expect(localStorage.getItem("tango-local-decks")).toBe(savedDecks);
    expect(localStorage.getItem("tango-local-cards")).toBe(savedCards);
    directView.unmount();
    directRouter.dispose();
  });
});
