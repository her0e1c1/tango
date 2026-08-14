/**
 * @file Verifies the "App" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "updates only the theme when
 * the setting changes", "shows startup feedback while authentication is in progress",
 * "shows startup errors and reloads on request".
 */

import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { useAuthSession } from "@/entities/auth";

type AuthSessionState = ReturnType<typeof useAuthSession>;

const mocks = vi.hoisted(() => ({
  darkMode: false,
  authState: { status: "initializing" } as AuthSessionState,
  startAuthSession: vi.fn(),
  stopAuthSession: vi.fn(),
  startRemoteReadSessionLifecycle: vi.fn(),
  stopRemoteReadSession: vi.fn(),
}));

vi.mock("@/app/providers/auth/lifecycle", () => ({ startAuthSession: mocks.startAuthSession }));
vi.mock("@/app/providers/remote-read/lifecycle", () => ({
  startRemoteReadSessionLifecycle: mocks.startRemoteReadSessionLifecycle,
}));
vi.mock("@/entities/preferences", () => ({
  usePreferences: () => ({ appearance: { darkMode: mocks.darkMode } }),
}));
vi.mock("@/entities/auth", () => ({ useAuthSession: () => mocks.authState }));
vi.mock("@/features/auth/sign-in", () => ({ loginGoogle: vi.fn() }));
vi.mock("@/features/auth/sign-out", () => ({ signOutCurrentUser: vi.fn() }));
vi.mock("@/pages/card-form", () => ({ CardFormPage: () => null }));
vi.mock("@/pages/card-list", () => ({ CardListPage: () => null }));
vi.mock("@/pages/card-view", () => ({ CardViewPage: () => null }));
vi.mock("@/pages/deck-form", () => ({ DeckFormPage: () => null }));
vi.mock("@/pages/deck-import", () => ({ DeckImportPage: () => null }));
vi.mock("@/pages/deck-list", () => ({ DeckListPage: () => <div>Deck list</div> }));
vi.mock("@/pages/deck-start", () => ({ DeckStartPage: () => null }));
vi.mock("@/pages/deck-swiper", () => ({ DeckSwiperPage: () => null }));
vi.mock("@/pages/settings", () => ({ SettingsPage: () => null }));

import App from "./App";

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.startAuthSession.mockReturnValue(mocks.stopAuthSession);
    mocks.startRemoteReadSessionLifecycle.mockReturnValue(mocks.stopRemoteReadSession);
    mocks.darkMode = false;
    mocks.authState = { status: "authenticated", uid: "test-user", isAnonymous: true, displayName: null };
    document.documentElement.classList.remove("dark");
    window.history.replaceState({}, "", "/");
  });

  it("starts and stops the application lifecycles", () => {
    const view = render(<App />);

    expect(mocks.startAuthSession).toHaveBeenCalledOnce();
    expect(mocks.startRemoteReadSessionLifecycle).toHaveBeenCalledOnce();

    view.unmount();

    expect(mocks.stopRemoteReadSession).toHaveBeenCalledOnce();
    expect(mocks.stopAuthSession).toHaveBeenCalledOnce();
  });

  it("updates only the theme when the setting changes", () => {
    const view = render(<App />);
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    mocks.darkMode = true;
    view.rerender(<App />);

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("shows startup feedback while authentication is in progress", () => {
    mocks.authState = { status: "initializing" };
    const view = render(<App />);

    expect(screen.getByRole("heading", { level: 1, name: "Starting Tango…" })).toBeInTheDocument();
    expect(screen.queryByText("Deck list")).toBeNull();

    mocks.authState = { status: "unauthenticated" };
    view.rerender(<App />);

    expect(screen.getByRole("heading", { level: 1, name: "Starting Tango…" })).toBeInTheDocument();
    expect(screen.queryByText("Deck list")).toBeNull();

    mocks.authState = { status: "authenticating", attemptId: Symbol("attempt-a") };
    view.rerender(<App />);

    expect(screen.getByRole("heading", { level: 1, name: "Starting Tango…" })).toBeInTheDocument();
    expect(screen.queryByText("Deck list")).toBeNull();
  });

  it("shows startup errors and reloads on request", () => {
    const reload = vi.fn();
    mocks.authState = { status: "error", error: new Error("auth failed") };
    render(<App reload={reload} />);

    expect(screen.getByRole("heading", { level: 1, name: "Unable to start Tango" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reload" }));
    expect(reload).toHaveBeenCalledOnce();
  });

  it("renders normal routes after authentication", () => {
    render(<App />);

    expect(screen.getByText("Deck list")).toBeInTheDocument();
  });

  it("recovers from authenticated unknown routes", () => {
    window.history.replaceState({}, "", "/unknown");
    render(<App />);

    expect(screen.getByRole("heading", { level: 1, name: "Page not found" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Go home" }));
    expect(window.location.pathname).toBe("/");
    expect(screen.getByText("Deck list")).toBeInTheDocument();
  });
});
