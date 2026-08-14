import { act, render, screen, waitFor } from "@testing-library/react";
import React, { type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  startCards: vi.fn(),
  stopCards: vi.fn(),
  stopDecks: vi.fn(),
  clearCards: vi.fn(),
  clearDecks: vi.fn(),
  deckReadyByUid: {} as Record<string, () => void>,
}));

vi.mock("@/features/card/read", () => ({
  startCardReads: mocks.startCards,
  stopCardReads: mocks.stopCards,
}));
vi.mock("@/entities/card", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/card")>();
  return {
    ...actual,
    clearCards: () => {
      mocks.clearCards();
      actual.clearCards();
    },
  };
});
vi.mock("@/entities/deck", () => ({ clearDecks: mocks.clearDecks }));
vi.mock("./deck", () => ({
  subscribeDecks: vi.fn((uid: string, onReady: () => void) => {
    mocks.deckReadyByUid[uid] = onReady;
    return mocks.stopDecks;
  }),
}));

import { RemoteReadProvider } from "@/app/providers/remote-read";
import { replaceAuthSession } from "@/entities/auth";
import { replaceCards, useCards } from "@/entities/card";
import { createCard } from "@/test/factories";

const CardConsumer = () => {
  const cards = useCards();
  return (
    <>
      {cards.map((card) => (
        <div key={card.id}>{card.frontText}</div>
      ))}
    </>
  );
};

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
    replaceCards([]);
    replaceAuthSession({ status: "initializing" });
    Object.keys(mocks.deckReadyByUid).forEach((uid) => {
      delete mocks.deckReadyByUid[uid];
    });
  });

  it("renders children after the current UID's first Deck snapshot", async () => {
    const { publishUser } = createHarness(<div>content</div>);

    act(() => publishUser("uid-a"));

    await waitFor(() => expect(mocks.startCards).toHaveBeenCalledWith("uid-a"));
    expect(screen.queryByText("content")).toBeNull();
    act(() => mocks.deckReadyByUid["uid-a"]?.());
    expect(screen.getByText("content")).toBeTruthy();
  });

  it("ignores readiness from a previous UID", async () => {
    const { publishUser } = createHarness(<div>content</div>);
    act(() => publishUser("uid-a"));
    await waitFor(() => expect(mocks.startCards).toHaveBeenCalledWith("uid-a"));
    const readyA = mocks.deckReadyByUid["uid-a"];
    act(() => publishUser("uid-b"));
    await waitFor(() => expect(mocks.startCards).toHaveBeenCalledWith("uid-b"));

    act(() => readyA?.());
    expect(screen.queryByText("content")).toBeNull();
    act(() => mocks.deckReadyByUid["uid-b"]?.());
    expect(screen.getByText("content")).toBeTruthy();
  });

  it("stops the previous UID before starting its replacement", async () => {
    const { publishUser } = createHarness();
    act(() => publishUser("uid-a"));
    await waitFor(() => expect(mocks.startCards).toHaveBeenCalledWith("uid-a"));
    act(() => publishUser("uid-b"));

    await waitFor(() => expect(mocks.startCards).toHaveBeenCalledWith("uid-b"));
    expect(mocks.stopCards).toHaveBeenCalledExactlyOnceWith("uid-a");
    expect(mocks.stopDecks).toHaveBeenCalledOnce();
    expect(mocks.clearCards).toHaveBeenCalled();
    expect(mocks.clearDecks).toHaveBeenCalled();
  });

  it("clears Card data after logout", async () => {
    const { publishUser } = createHarness();
    act(() => publishUser("uid-a"));
    await waitFor(() => expect(mocks.startCards).toHaveBeenCalledWith("uid-a"));
    mocks.clearCards.mockClear();

    act(() => publishUser(null));

    await waitFor(() => expect(mocks.stopCards).toHaveBeenCalledWith("uid-a"));
    expect(mocks.clearCards).toHaveBeenCalled();
  });

  it("hides the previous user's Card while logout clears the read scope", async () => {
    const card = createCard({ id: "card-a", uid: "uid-a", frontText: "Previous user Card" });
    const { publishUser } = createHarness(
      <>
        <div>scope content</div>
        <CardConsumer />
      </>
    );
    act(() => publishUser("uid-a"));
    await waitFor(() => expect(mocks.startCards).toHaveBeenCalledWith("uid-a"));
    const readyA = mocks.deckReadyByUid["uid-a"];
    act(() => readyA?.());
    act(() => replaceCards([card]));
    expect(screen.getByText(card.frontText)).toBeTruthy();

    act(() => publishUser(null));

    expect(screen.queryByText(card.frontText)).toBeNull();
    expect(screen.getByText("scope content")).toBeTruthy();
    act(() => readyA?.());
    expect(screen.getByText("scope content")).toBeTruthy();
    await waitFor(() => expect(mocks.stopCards).toHaveBeenCalledWith("uid-a"));

    act(() => publishUser("uid-a"));
    await waitFor(() => expect(mocks.startCards).toHaveBeenCalledTimes(2));
    expect(screen.queryByText("scope content")).toBeNull();
    act(() => mocks.deckReadyByUid["uid-a"]?.());
    expect(screen.getByText("scope content")).toBeTruthy();
  });
});
