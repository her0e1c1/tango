/**
 * @file Verifies the application shell through user-visible routing and theme behavior.
 */

import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { setDarkMode, updatePreferences } from "@/entities/preference";
import { dismissToast, showToast } from "@/shared/ui/toast";
import { createPreferences } from "@/test/factories";

vi.mock("@/app/auth", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/app/firestore-subscriptions", () => ({
  FirestoreSubscriptionsProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/pages/account", () => ({ AccountPage: () => null }));
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

describe("App", () => {
  beforeEach(() => {
    dismissToast();
    updatePreferences(createPreferences({ appearance: { darkMode: false } }));
    document.documentElement.classList.remove("dark");
    window.history.replaceState({}, "", "/");
  });

  it("follows the saved theme while the application is mounted", () => {
    render(<App />);
    expect(document.documentElement).not.toHaveClass("dark");

    act(() => {
      setDarkMode(true);
    });

    expect(document.documentElement).toHaveClass("dark");
  });

  it("renders the home route", () => {
    render(<App />);

    expect(screen.getByText("Deck list")).toBeInTheDocument();
  });

  it("hosts notifications outside the route tree", () => {
    render(<App />);

    act(() => {
      showToast({ message: "Saved", tone: "success" });
    });

    expect(screen.getByRole("status")).toHaveTextContent("Success: Saved");
  });

  it("restores focus to the application shell when a notification outlives its source route", () => {
    window.history.replaceState({}, "", "/unknown");
    render(<App />);
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
    window.history.replaceState({}, "", "/deck/new");
    render(<App />);

    expect(screen.getByText("Deck create")).toBeInTheDocument();
  });

  it("matches the Card create route within its target Deck", () => {
    window.history.replaceState({}, "", "/deck/deck-id/card/new");
    render(<App />);

    expect(screen.getByText("Card create")).toBeInTheDocument();
  });

  it("recovers from unknown routes", () => {
    window.history.replaceState({}, "", "/unknown");
    render(<App />);

    expect(screen.getByRole("heading", { level: 1, name: "Page not found" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Go home" }));
    expect(window.location.pathname).toBe("/");
    expect(screen.getByText("Deck list")).toBeInTheDocument();
  });
});
