import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { User } from "firebase/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthState } from "@/auth/AuthContext";

const mocks = vi.hoisted(() => ({
  darkMode: false,
  init: vi.fn(),
  authState: { status: "initializing" } as AuthState,
}));

vi.mock("zustand", () => ({
  useStore: (_store: unknown, select: (state: unknown) => unknown) =>
    select({
      config: { darkMode: mocks.darkMode },
    }),
}));
vi.mock("@/store/configStore", () => ({ configStore: {} }));
vi.mock("@/action", () => ({ event: { init: mocks.init } }));
vi.mock("@/auth/AuthContext", () => ({ useAuth: () => mocks.authState }));
vi.mock("@/page", () => ({
  DeckListPage: () => <div>Deck list</div>,
  CardListPage: () => null,
  DeckFormPage: () => null,
  DeckStartPage: () => null,
  DeckSwiperPage: () => null,
  CardViewPage: () => null,
  CardFormPage: () => null,
  ConfigPage: () => null,
  DeckImportPage: () => null,
}));

import App from "@/App";

describe("App", () => {
  beforeEach(() => {
    mocks.darkMode = false;
    mocks.init.mockReset();
    mocks.authState = { status: "authenticated", user: {} as User, uid: "test-user" };
    document.documentElement.classList.remove("dark");
    window.history.replaceState({}, "", "/");
  });

  it("updates only the theme when the setting changes", () => {
    const view = render(<App />);
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    mocks.darkMode = true;
    view.rerender(<App />);

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(mocks.init).not.toHaveBeenCalled();
  });

  it("shows startup feedback for initializing and signed-out authentication", () => {
    mocks.authState = { status: "initializing" };
    const view = render(<App />);

    expect(screen.getByRole("heading", { level: 1, name: "Starting Tango…" })).toBeInTheDocument();
    expect(screen.queryByText("Deck list")).toBeNull();

    mocks.authState = { status: "signedOut" };
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
