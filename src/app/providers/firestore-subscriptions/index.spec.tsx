import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { useAuthSession } from "@/entities/auth";

type AuthSessionState = ReturnType<typeof useAuthSession>;

const mocks = vi.hoisted(() => ({
  authState: { status: "initializing" } as AuthSessionState,
  subscribeCards: vi.fn(),
  subscribeDecks: vi.fn(),
  setCardReadError: vi.fn(),
  setCardReadLoading: vi.fn(),
  setCardReadReady: vi.fn(),
  operations: [] as string[],
}));

vi.mock("@/entities/auth", () => ({ useAuthSession: () => mocks.authState }));
vi.mock("@/entities/card", () => ({
  clearCards: () => mocks.operations.push("clear Cards"),
  subscribeCards: mocks.subscribeCards,
}));
vi.mock("@/entities/deck", () => ({
  clearDecks: () => mocks.operations.push("clear Decks"),
  subscribeDecks: mocks.subscribeDecks,
}));
vi.mock("@/features/card/read", () => ({
  resetCardRead: (uid?: string) => mocks.operations.push(`reset Card read ${uid ?? "all"}`),
  setCardReadError: mocks.setCardReadError,
  setCardReadLoading: mocks.setCardReadLoading,
  setCardReadReady: mocks.setCardReadReady,
}));

import { FirestoreSubscriptionsProvider } from ".";

describe("FirestoreSubscriptionsProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.subscribeCards.mockImplementation((uid: string) => {
      mocks.operations.push(`start Cards ${uid}`);
      return () => mocks.operations.push(`stop Cards ${uid}`);
    });
    mocks.subscribeDecks.mockImplementation((uid: string) => {
      mocks.operations.push(`start Decks ${uid}`);
      return () => mocks.operations.push(`stop Decks ${uid}`);
    });
    mocks.operations.length = 0;
    mocks.authState = { status: "authenticated", uid: "test-user", isAnonymous: true, displayName: null };
  });

  it("starts subscriptions for the authenticated UID and cleans them up on unmount", () => {
    const view = render(<FirestoreSubscriptionsProvider>content</FirestoreSubscriptionsProvider>);

    expect(mocks.operations).toEqual(["start Cards test-user", "start Decks test-user"]);
    expect(screen.getByText("content")).toBeDefined();

    view.unmount();

    expect(mocks.operations).toEqual([
      "start Cards test-user",
      "start Decks test-user",
      "stop Cards test-user",
      "stop Decks test-user",
      "reset Card read test-user",
      "clear Cards",
      "clear Decks",
    ]);
  });

  it("updates the Card read state from subscription events", () => {
    render(<FirestoreSubscriptionsProvider />);
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

  it("replaces subscriptions when the authenticated UID changes", () => {
    const view = render(<FirestoreSubscriptionsProvider />);
    mocks.operations.length = 0;

    mocks.authState = { status: "authenticated", uid: "next-user", isAnonymous: false, displayName: "Ada" };
    view.rerender(<FirestoreSubscriptionsProvider />);

    expect(mocks.operations).toEqual([
      "stop Cards test-user",
      "stop Decks test-user",
      "reset Card read test-user",
      "clear Cards",
      "clear Decks",
      "start Cards next-user",
      "start Decks next-user",
    ]);
    expect(mocks.setCardReadLoading).toHaveBeenLastCalledWith("next-user");
  });

  it("keeps subscriptions when authentication metadata changes for the same UID", () => {
    const view = render(<FirestoreSubscriptionsProvider />);
    mocks.operations.length = 0;

    mocks.authState = { status: "authenticated", uid: "test-user", isAnonymous: false, displayName: "Ada" };
    view.rerender(<FirestoreSubscriptionsProvider />);

    expect(mocks.operations).toEqual([]);
    expect(mocks.subscribeCards).toHaveBeenCalledOnce();
    expect(mocks.subscribeDecks).toHaveBeenCalledOnce();
  });

  it("stops subscriptions and clears related state on logout", () => {
    const view = render(<FirestoreSubscriptionsProvider />);
    mocks.operations.length = 0;

    mocks.authState = { status: "unauthenticated" };
    view.rerender(<FirestoreSubscriptionsProvider />);

    expect(mocks.operations).toEqual([
      "stop Cards test-user",
      "stop Decks test-user",
      "reset Card read test-user",
      "clear Cards",
      "clear Decks",
    ]);
  });
});
