import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authUid: "",
  subscribeCards: vi.fn(),
  subscribeDecks: vi.fn(),
  operations: [] as string[],
}));

vi.mock("@/entities/auth", () => ({ useAuthUid: () => mocks.authUid }));
vi.mock("@/entities/card", () => ({
  clearRemoteCards: () => mocks.operations.push("clear remote Cards"),
  subscribeCards: mocks.subscribeCards,
}));
vi.mock("@/entities/deck", () => ({
  clearRemoteDecks: () => mocks.operations.push("clear remote Decks"),
  subscribeDecks: mocks.subscribeDecks,
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
    mocks.authUid = "test-user";
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
      "clear remote Cards",
      "clear remote Decks",
    ]);
  });

  it("does not subscribe or clear remote state before authentication", () => {
    mocks.authUid = "";

    const view = render(<FirestoreSubscriptionsProvider />);
    view.unmount();

    expect(mocks.operations).toEqual([]);
  });

  it("replaces subscriptions when the authenticated UID changes", () => {
    const view = render(<FirestoreSubscriptionsProvider />);
    mocks.operations.length = 0;

    mocks.authUid = "next-user";
    view.rerender(<FirestoreSubscriptionsProvider />);

    expect(mocks.operations).toEqual([
      "stop Cards test-user",
      "stop Decks test-user",
      "clear remote Cards",
      "clear remote Decks",
      "start Cards next-user",
      "start Decks next-user",
    ]);
  });

  it("keeps subscriptions when the authenticated UID is unchanged", () => {
    const view = render(<FirestoreSubscriptionsProvider />);
    mocks.operations.length = 0;

    view.rerender(<FirestoreSubscriptionsProvider />);

    expect(mocks.operations).toEqual([]);
    expect(mocks.subscribeCards).toHaveBeenCalledOnce();
    expect(mocks.subscribeDecks).toHaveBeenCalledOnce();
  });

  it("stops subscriptions and clears related state on logout", () => {
    const view = render(<FirestoreSubscriptionsProvider />);
    mocks.operations.length = 0;

    mocks.authUid = "";
    view.rerender(<FirestoreSubscriptionsProvider />);

    expect(mocks.operations).toEqual([
      "stop Cards test-user",
      "stop Decks test-user",
      "clear remote Cards",
      "clear remote Decks",
    ]);
  });
});
