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

describe("RTL-NAVIGATION-01 Deck navigation through App, router, and local Entities", () => {
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

  it.each(cases)(
    "RTL-NAVIGATION-01 opens only $id Cards and preserves the destination on direct entry",
    async (selected) => {
      // Given: Mount the real App and router with distinct decks and capture their Entity state.
      const decksBefore = structuredClone(getDecks());
      const cardsBefore = structuredClone(getCards());
      const router = createMemoryRouter(appRoutes, { initialEntries: ["/"] });
      const view = render(<App router={router} />);

      // When: Select this deck through its named list action.
      await userEvent.click(screen.getByRole("button", { name: `Open cards in ${selected.name}` }));

      // Then: Only the selected deck cards appear at the expected route.
      expect(await screen.findByRole("button", { name: `View ${selected.frontText}` })).toBeVisible();
      expect(router.state.location).toMatchObject({ pathname: selected.path, search: "", hash: "" });
      for (const other of cases.filter(({ id }) => id !== selected.id)) {
        expect(screen.queryByRole("button", { name: `View ${other.frontText}` })).not.toBeInTheDocument();
      }

      // When: Remount the App at the encoded destination, keeping the loaded Entity state.
      view.unmount();
      router.dispose();
      const directRouter = createMemoryRouter(appRoutes, { initialEntries: [selected.path] });
      const directView = render(<App router={directRouter} />);
      // Then: Direct entry still selects the same cards without changing Entity data.
      expect(await screen.findByRole("button", { name: `View ${selected.frontText}` })).toBeVisible();
      for (const other of cases.filter(({ id }) => id !== selected.id)) {
        expect(screen.queryByRole("button", { name: `View ${other.frontText}` })).not.toBeInTheDocument();
      }
      expect(directRouter.state.location).toMatchObject({ pathname: selected.path, search: "", hash: "" });
      expect(getDecks()).toEqual(decksBefore);
      expect(getCards()).toEqual(cardsBefore);
      directView.unmount();
      directRouter.dispose();
    }
  );
});
