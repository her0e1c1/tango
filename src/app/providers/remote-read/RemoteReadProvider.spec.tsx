import { act, render, screen, waitFor } from "@testing-library/react";
import React, { type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  stopCards: vi.fn(),
  stopDecks: vi.fn(),
  clearCards: vi.fn(),
  clearDecks: vi.fn(),
  cardReadyByUid: {} as Record<string, () => void>,
  deckReadyByUid: {} as Record<string, () => void>,
}));

vi.mock("@/entities/card", () => ({ clearCards: mocks.clearCards }));
vi.mock("@/entities/deck", () => ({ clearDecks: mocks.clearDecks }));
vi.mock("./card", () => ({
  subscribeCards: vi.fn((uid: string, onReady: () => void) => {
    mocks.cardReadyByUid[uid] = onReady;
    return mocks.stopCards;
  }),
}));
vi.mock("./deck", () => ({
  subscribeDecks: vi.fn((uid: string, onReady: () => void) => {
    mocks.deckReadyByUid[uid] = onReady;
    return mocks.stopDecks;
  }),
}));

import { RemoteReadProvider } from "@/app/providers/remote-read";
import { replaceAuthSession } from "@/entities/auth";

const createHarness = (children?: ReactNode) => {
  const publishUser = (uid: string | null) =>
    replaceAuthSession(
      uid == null ? { status: "signedOut" } : { status: "authenticated", uid, isAnonymous: true, displayName: null }
    );
  render(
    <React.StrictMode>
      <RemoteReadProvider>{children}</RemoteReadProvider>
    </React.StrictMode>
  );
  return { publishUser };
};

describe("RemoteReadProvider integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceAuthSession({ status: "initializing" });
    Object.keys(mocks.deckReadyByUid).forEach((uid) => {
      delete mocks.deckReadyByUid[uid];
    });
    Object.keys(mocks.cardReadyByUid).forEach((uid) => {
      delete mocks.cardReadyByUid[uid];
    });
  });

  it("renders children after the current UID's first Card and Deck snapshots", async () => {
    const { publishUser } = createHarness(<div>content</div>);

    act(() => publishUser("uid-a"));

    await waitFor(() => expect(mocks.cardReadyByUid["uid-a"]).toBeTypeOf("function"));
    expect(screen.queryByText("content")).toBeNull();
    act(() => mocks.deckReadyByUid["uid-a"]?.());
    expect(screen.queryByText("content")).toBeNull();
    act(() => mocks.cardReadyByUid["uid-a"]?.());
    expect(screen.getByText("content")).toBeTruthy();
  });

  it("ignores readiness from a previous UID", async () => {
    const { publishUser } = createHarness(<div>content</div>);
    act(() => publishUser("uid-a"));
    await waitFor(() => expect(mocks.cardReadyByUid["uid-a"]).toBeTypeOf("function"));
    const readyA = mocks.deckReadyByUid["uid-a"];
    act(() => publishUser("uid-b"));
    await waitFor(() => expect(mocks.cardReadyByUid["uid-b"]).toBeTypeOf("function"));

    act(() => readyA?.());
    expect(screen.queryByText("content")).toBeNull();
    act(() => {
      mocks.deckReadyByUid["uid-b"]?.();
      mocks.cardReadyByUid["uid-b"]?.();
    });
    expect(screen.getByText("content")).toBeTruthy();
  });

  it("stops the previous UID before starting its replacement", async () => {
    const { publishUser } = createHarness();
    act(() => publishUser("uid-a"));
    await waitFor(() => expect(mocks.cardReadyByUid["uid-a"]).toBeTypeOf("function"));
    act(() => publishUser("uid-b"));

    await waitFor(() => expect(mocks.cardReadyByUid["uid-b"]).toBeTypeOf("function"));
    expect(mocks.stopCards).toHaveBeenCalledOnce();
    expect(mocks.stopDecks).toHaveBeenCalledOnce();
    expect(mocks.clearCards).toHaveBeenCalled();
    expect(mocks.clearDecks).toHaveBeenCalled();
  });
});
