/**
 * @file Verifies the application shell through user-visible routing and theme behavior.
 */

import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { createMemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { setDarkMode, updatePreferences } from "@/entities/preference";
import { dismissToast, showToast } from "@/shared/ui/toast";
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
vi.mock("@/pages/card-form", () => ({ CardFormPage: () => null }));
vi.mock("@/pages/card-list", () => ({ CardListPage: () => null }));
vi.mock("@/pages/card-view", () => ({ CardViewPage: () => null }));
vi.mock("@/pages/deck-create", () => ({ DeckCreatePage: () => <div>Deck create</div> }));
vi.mock("@/pages/deck-form", () => ({ DeckFormPage: () => null }));
vi.mock("@/pages/deck-import", () => ({ DeckImportPage: () => null }));
vi.mock("@/pages/deck-list", () => ({ DeckListPage: () => <div>Deck list</div> }));
vi.mock("@/pages/settings", () => ({ SettingsPage: () => null }));
vi.mock("@/pages/study-session", () => ({ StudySessionPage: () => null }));
vi.mock("@/pages/study-session-start", () => ({ StudySessionStartPage: () => null }));

import App from "./App";
import { appRoutes } from "./routes";

const renderApp = (path = "/") => {
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  return { router, view: render(<App router={router} />) };
};

describe("App", () => {
  beforeEach(() => {
    dismissToast();
    routeMocks.accountThrows = false;
    updatePreferences(createPreferences({ appearance: { darkMode: false } }));
    document.documentElement.classList.remove("dark");
    window.history.replaceState({}, "", "/");
  });

  it("follows the saved theme while the application is mounted", () => {
    renderApp();
    expect(document.documentElement).not.toHaveClass("dark");

    act(() => {
      setDarkMode(true);
    });

    expect(document.documentElement).toHaveClass("dark");
  });

  it("renders the home route", () => {
    renderApp();

    expect(screen.getByText("Deck list")).toBeInTheDocument();
  });

  it("hosts notifications outside the route tree", () => {
    renderApp();

    act(() => {
      showToast({ message: "Saved", tone: "success" });
    });

    expect(screen.getByRole("status")).toHaveTextContent("Success: Saved");
  });

  it("restores focus to the application shell when a notification outlives its source route", () => {
    renderApp("/unknown");
    const sourceAction = screen.getByRole("button", { name: "Go home" });
    sourceAction.focus();
    act(() => {
      showToast({ message: "Saved", tone: "success", durationMs: null });
    });

    fireEvent.click(sourceAction);
    expect(sourceAction).not.toBeInTheDocument();
    expect(screen.getByText("Deck list")).toBeInTheDocument();
    const dismissButton = screen.getByRole("button", { name: "Dismiss notification" });
    dismissButton.focus();
    fireEvent.click(dismissButton);

    expect(screen.getByRole("main")).toHaveFocus();
  });

  it("matches the static Deck create route instead of treating new as a Deck id", () => {
    renderApp("/deck/new");

    expect(screen.getByText("Deck create")).toBeInTheDocument();
  });

  it("matches the Card create route within its target Deck", () => {
    renderApp("/deck/deck-id/card/new");

    expect(screen.getByText("Card create")).toBeInTheDocument();
  });

  it("recovers from unknown routes", () => {
    const { router } = renderApp("/unknown");

    expect(screen.getByRole("heading", { level: 1, name: "Page not found" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Go home" }));
    expect(router.state.location.pathname).toBe("/");
    expect(screen.getByText("Deck list")).toBeInTheDocument();
  });

  it("uses Tango recovery feedback when a route render fails", () => {
    routeMocks.accountThrows = true;
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    renderApp("/account");

    expect(screen.getByRole("alert")).toBeVisible();
    expect(screen.getByRole("heading", { level: 1, name: "Something went wrong" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Reload" })).toBeVisible();
    consoleError.mockRestore();
  });
});
