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
  subscribeCards: vi.fn(),
  subscribeDecks: vi.fn(),
  resetCardRead: vi.fn(),
  setCardReadError: vi.fn(),
  setCardReadLoading: vi.fn(),
  setCardReadReady: vi.fn(),
  operations: [] as string[],
}));

vi.mock("@/app/providers/auth/lifecycle", () => ({ startAuthSession: mocks.startAuthSession }));
vi.mock("@/app/providers/remote-read/deck", () => ({
  subscribeDecks: mocks.subscribeDecks,
}));
vi.mock("@/entities/card", () => ({
  clearCards: () => mocks.operations.push("clear Cards"),
}));
vi.mock("@/entities/deck", () => ({ clearDecks: () => mocks.operations.push("clear Decks") }));
vi.mock("@/entities/preferences", () => ({
  usePreferences: () => ({ appearance: { darkMode: mocks.darkMode } }),
}));
vi.mock("@/entities/auth", () => ({ useAuthSession: () => mocks.authState }));
vi.mock("@/features/card/read", () => ({
  resetCardRead: mocks.resetCardRead,
  setCardReadError: mocks.setCardReadError,
  setCardReadLoading: mocks.setCardReadLoading,
  setCardReadReady: mocks.setCardReadReady,
}));
vi.mock("@/features/firebase-runtime", () => ({
  createCard: vi.fn(),
  deleteCard: vi.fn(),
  editCard: vi.fn(),
  generateCardId: vi.fn(),
  createDeck: vi.fn(),
  deleteDeck: vi.fn(),
  editDeck: vi.fn(),
  generateDeckId: vi.fn(),
  editStudyProgress: vi.fn(),
  loginGoogle: vi.fn(),
  signOutCurrentUser: vi.fn(),
  subscribeCards: mocks.subscribeCards,
}));
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
    mocks.subscribeCards.mockImplementation((uid: string) => {
      mocks.operations.push(`start Cards ${uid}`);
      return () => mocks.operations.push(`stop Cards ${uid}`);
    });
    mocks.subscribeDecks.mockImplementation((uid: string) => {
      mocks.operations.push(`start Decks ${uid}`);
      return () => mocks.operations.push(`stop Decks ${uid}`);
    });
    mocks.operations.length = 0;
    mocks.darkMode = false;
    mocks.authState = { status: "authenticated", uid: "test-user", isAnonymous: true, displayName: null };
    document.documentElement.classList.remove("dark");
    window.history.replaceState({}, "", "/");
  });

  it("starts and stops the authentication lifecycle", () => {
    const view = render(<App />);

    expect(mocks.startAuthSession).toHaveBeenCalledOnce();

    view.unmount();

    expect(mocks.stopAuthSession).toHaveBeenCalledOnce();
  });

  it("starts and stops remote reads for the authenticated UID", () => {
    const view = render(<App />);

    expect(mocks.operations).toEqual(["start Cards test-user", "start Decks test-user"]);

    view.unmount();

    expect(mocks.operations).toEqual([
      "start Cards test-user",
      "start Decks test-user",
      "stop Cards test-user",
      "stop Decks test-user",
      "clear Cards",
      "clear Decks",
    ]);
  });

  it("updates the Card read state from subscription events", () => {
    render(<App />);
    const onError = mocks.subscribeCards.mock.calls[0]?.[1] as (error: Error) => void;
    const onData = mocks.subscribeCards.mock.calls[0]?.[2] as (metadata: {
      fromCache: boolean;
      hasPendingWrites: boolean;
    }) => void;
    const error = new Error("Card subscription failed");

    expect(mocks.setCardReadLoading).toHaveBeenCalledWith("test-user");
    onData({ fromCache: true, hasPendingWrites: false });
    onData({ fromCache: false, hasPendingWrites: true });
    onData({ fromCache: false, hasPendingWrites: false });
    onError(error);

    expect(mocks.setCardReadReady).toHaveBeenNthCalledWith(1, "test-user", false);
    expect(mocks.setCardReadReady).toHaveBeenNthCalledWith(2, "test-user", false);
    expect(mocks.setCardReadReady).toHaveBeenNthCalledWith(3, "test-user", true);
    expect(mocks.setCardReadError).toHaveBeenCalledWith("test-user", error);
  });

  it("replaces remote reads when the authenticated UID changes", () => {
    const view = render(<App />);
    mocks.operations.length = 0;

    mocks.authState = { status: "authenticated", uid: "next-user", isAnonymous: false, displayName: "Ada" };
    view.rerender(<App />);

    expect(mocks.operations).toEqual([
      "stop Cards test-user",
      "stop Decks test-user",
      "clear Cards",
      "clear Decks",
      "start Cards next-user",
      "start Decks next-user",
    ]);
  });

  it("keeps remote reads when authentication metadata changes for the same UID", () => {
    const view = render(<App />);
    mocks.operations.length = 0;

    mocks.authState = { status: "authenticated", uid: "test-user", isAnonymous: false, displayName: "Ada" };
    view.rerender(<App />);

    expect(mocks.operations).toEqual([]);
  });

  it("stops remote reads and clears data on logout", () => {
    const view = render(<App />);
    mocks.operations.length = 0;

    mocks.authState = { status: "unauthenticated" };
    view.rerender(<App />);

    expect(mocks.operations).toEqual(["stop Cards test-user", "stop Decks test-user", "clear Cards", "clear Decks"]);
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
