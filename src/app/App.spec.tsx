/**
 * @file Verifies the application shell through user-visible routing and theme behavior.
 */

import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { setDarkMode, updatePreferences } from "@/entities/preferences";
import { createPreferences } from "@/test/factories";

vi.mock("@/app/providers/auth", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/app/providers/firestore-subscriptions", () => ({
  FirestoreSubscriptionsProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/features/sign-in", () => ({ loginGoogle: vi.fn() }));
vi.mock("@/features/sign-out", () => ({ signOutCurrentUser: vi.fn() }));
vi.mock("@/pages/card-form", () => ({ CardFormPage: () => null }));
vi.mock("@/pages/card-list", () => ({ CardListPage: () => null }));
vi.mock("@/pages/card-view", () => ({ CardViewPage: () => null }));
vi.mock("@/pages/deck-form", () => ({ DeckFormPage: () => null }));
vi.mock("@/pages/deck-import", () => ({ DeckImportPage: () => null }));
vi.mock("@/pages/deck-list", () => ({ DeckListPage: () => <div>Deck list</div> }));
vi.mock("@/pages/settings", () => ({ SettingsPage: () => null }));
vi.mock("@/pages/study-session", () => ({ StudySessionPage: () => null }));
vi.mock("@/pages/study-session-start", () => ({ StudySessionStartPage: () => null }));

import App from "./App";

describe("App", () => {
  beforeEach(() => {
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

  it("recovers from unknown routes", () => {
    window.history.replaceState({}, "", "/unknown");
    render(<App />);

    expect(screen.getByRole("heading", { level: 1, name: "Page not found" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Go home" }));
    expect(window.location.pathname).toBe("/");
    expect(screen.getByText("Deck list")).toBeInTheDocument();
  });
});
