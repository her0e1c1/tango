/**
 * @file Verifies the "App" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "updates only the theme when
 * the setting changes" and "renders normal routes".
 */

import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  darkMode: false,
}));

vi.mock("@/app/providers/auth", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/app/providers/firestore-subscriptions", () => ({
  FirestoreSubscriptionsProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/entities/preferences", () => ({
  usePreferences: () => ({ appearance: { darkMode: mocks.darkMode } }),
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
    vi.clearAllMocks();
    mocks.darkMode = false;
    document.documentElement.classList.remove("dark");
    window.history.replaceState({}, "", "/");
  });

  it("updates only the theme when the setting changes", () => {
    const view = render(<App />);
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    mocks.darkMode = true;
    view.rerender(<App />);

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("renders normal routes", () => {
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
