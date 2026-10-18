/**
 * @file Verifies the application shell through user-visible routing and theme behavior.
 */

import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { createMemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { setDarkMode, updatePreferences } from "@/entities/preference";
import { showToast } from "@/shared/ui/toast";
import { dismissToast } from "@/test/utils/toast";
import { createPreferences } from "@/test/factories";

const routeMocks = vi.hoisted(() => ({ accountThrows: false }));

vi.mock("@/app/auth", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/app/firestore-subscriptions", () => ({
  FirestoreSubscriptionsProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/pages/account", () => ({
  AccountPage: () => {
    if (routeMocks.accountThrows) throw new Error("route render failed");
    return null;
  },
}));
vi.mock("@/pages/card-create", () => ({ CardCreatePage: () => <div>Card create</div> }));
vi.mock("@/pages/card-edit", () => ({ CardEditPage: () => null }));
vi.mock("@/pages/card-list", () => ({ CardListPage: () => null }));
vi.mock("@/pages/card-view", () => ({ CardViewPage: () => null }));
vi.mock("@/pages/deck-create", () => ({ DeckCreatePage: () => <div>Deck create</div> }));
vi.mock("@/pages/deck-edit", () => ({ DeckEditPage: () => null }));
vi.mock("@/pages/deck-import", () => ({ DeckImportPage: () => null }));
vi.mock("@/pages/deck-list", () => ({ DeckListPage: () => <div>Deck list</div> }));
vi.mock("@/pages/deck-view", () => ({ DeckViewPage: () => null }));
vi.mock("@/pages/settings", () => ({ SettingsPage: () => null }));
vi.mock("@/pages/study-history", () => ({ StudyHistoryPage: () => <div>Study history</div> }));
vi.mock("@/pages/study-session", () => ({ StudySessionPage: () => null }));
vi.mock("@/pages/study-session-start", () => ({ StudySessionStartPage: () => null }));

import App from "./App";
import { appRoutes } from "./routes";

const renderApp = (path = "/") => {
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  return { router, view: render(<App router={router} />) };
};

describe("App [ACCOUNT-02] [STUDY-SESSION-10]", () => {
  beforeEach(() => {
    // Given: Establish the shared setup used by the following cases.
    dismissToast();
    routeMocks.accountThrows = false;
    updatePreferences(createPreferences({ appearance: { darkMode: false } }));
    document.documentElement.classList.remove("dark");
    window.history.replaceState({}, "", "/");
  });

  it("follows the saved theme while the application is mounted", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `renderApp` with the prepared inputs.
    renderApp();
    // Then: Verify the expected result in the assertions below.
    expect(document.documentElement).not.toHaveClass("dark");

    // When: Exercise `act` with the prepared inputs.
    act(() => {
      setDarkMode(true);
    });

    // Then: Verify the expected result in the assertions below.
    expect(document.documentElement).toHaveClass("dark");
  });

  it("renders the home route", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `renderApp` with the prepared inputs.
    renderApp();

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("Deck list")).toBeInTheDocument();
  });

  it("renders the independent study history route with a Deck query", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `renderApp` with the prepared inputs.
    renderApp("/study-history?deckId=deck-id");
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("Study history")).toBeInTheDocument();
  });

  it("hosts notifications outside the route tree", () => {
    // Given: Use this case's inputs and any shared test setup.
    renderApp();

    // When: Exercise `act` with the prepared inputs.
    act(() => {
      showToast({ messageKey: "account.toast.signInSuccess", tone: "success" });
    });

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("status")).toHaveTextContent("Success: Signed in.");
  });

  it("restores focus to the application shell when a notification outlives its source route", () => {
    // Given: Prepare `sourceAction` and any shared test state below.
    renderApp("/unknown");
    const sourceAction = screen.getByRole("button", { name: "Go home" });
    sourceAction.focus();
    act(() => {
      showToast({ messageKey: "account.toast.signInSuccess", tone: "success", durationMs: null });
    });

    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(sourceAction);
    // Then: Verify the expected result in the assertions below.
    expect(sourceAction).not.toBeInTheDocument();
    expect(screen.getByText("Deck list")).toBeInTheDocument();
    const dismissButton = screen.getByRole("button", { name: "Dismiss notification" });
    // When: Exercise `dismissButton.focus` with the prepared inputs.
    dismissButton.focus();
    fireEvent.click(dismissButton);

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("main")).toHaveFocus();
  });

  it("matches the static Deck create route instead of treating new as a Deck id", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `renderApp` with the prepared inputs.
    renderApp("/deck/new");

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("Deck create")).toBeInTheDocument();
  });

  it("matches the Card create route within its target Deck", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `renderApp` with the prepared inputs.
    renderApp("/deck/deck-id/card/new");

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("Card create")).toBeInTheDocument();
  });

  it("recovers from unknown routes", () => {
    // Given: Use this case's inputs and any shared test setup.
    const { router } = renderApp("/unknown");

    expect(screen.getByRole("heading", { level: 1, name: "Page not found" })).toBeInTheDocument();
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(screen.getByRole("button", { name: "Go home" }));
    // Then: Verify the expected result in the assertions below.
    expect(router.state.location.pathname).toBe("/");
    expect(screen.getByText("Deck list")).toBeInTheDocument();
  });

  it("uses Tango recovery feedback when a route render fails", () => {
    // Given: Prepare `consoleError` and any shared test state below.
    routeMocks.accountThrows = true;
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    // When: Exercise `renderApp` with the prepared inputs.
    renderApp("/account");

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("alert")).toBeVisible();
    expect(screen.getByRole("heading", { level: 1, name: "Something went wrong" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Reload" })).toBeVisible();
    consoleError.mockRestore();
  });
});
