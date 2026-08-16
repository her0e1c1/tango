import type { Card } from "@/entities/card";
import type { Deck, DeckCreateInput } from "@/entities/deck";

import { renderHook, waitFor } from "@testing-library/react";
import React, { type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: { status: "authenticated", uid: "uid-a" } as { status: "authenticated"; uid: string } | { status: "loading" },
  remote: {
    cards: [] as Card[],
    decks: [] as Deck[],
  },
  createDeck: vi.fn<(_uid: string, _deck: DeckCreateInput) => Promise<unknown>>(),
  generateCardId: vi.fn(() => "card-id"),
  addSample: vi.fn<() => Promise<unknown>>(),
}));

vi.mock("@/entities/auth", () => ({
  useAuthUid: () => (mocks.auth.status === "authenticated" ? mocks.auth.uid : ""),
}));
vi.mock("@/entities/card", () => ({
  generateCardId: mocks.generateCardId,
  useCards: () => mocks.remote.cards,
}));
vi.mock("@/entities/deck", () => ({
  createDeck: mocks.createDeck,
  useDecks: () => mocks.remote.decks,
}));
vi.mock("../model/sampleDeck", () => ({ addSampleDeck: mocks.addSample }));

import { useSampleDeckBootstrap } from "./useSampleDeckBootstrap";

const strictMode = ({ children }: { children: ReactNode }) => <React.StrictMode>{children}</React.StrictMode>;

describe("sample Deck bootstrap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth = { status: "authenticated", uid: crypto.randomUUID() };
    mocks.remote = { cards: [], decks: [] };
    mocks.addSample.mockResolvedValue(undefined);
  });

  it("adds the sample once for an empty user under StrictMode", async () => {
    renderHook(useSampleDeckBootstrap, { wrapper: strictMode });

    await waitFor(() => expect(mocks.addSample).toHaveBeenCalledOnce());
  });

  it("does not add the sample when the user already has a Deck", () => {
    mocks.remote.decks = [{ id: "existing" } as Deck];

    renderHook(useSampleDeckBootstrap);

    expect(mocks.addSample).not.toHaveBeenCalled();
  });

  it("adds the sample again when Decks become empty after a completed bootstrap", async () => {
    const { unmount } = renderHook(useSampleDeckBootstrap);
    await waitFor(() => expect(mocks.addSample).toHaveBeenCalledOnce());
    unmount();

    mocks.remote.decks = [{ id: "sample" } as Deck];
    const { unmount: unmountPopulated } = renderHook(useSampleDeckBootstrap);
    expect(mocks.addSample).toHaveBeenCalledOnce();
    unmountPopulated();

    mocks.remote.decks = [];
    renderHook(useSampleDeckBootstrap);

    await waitFor(() => expect(mocks.addSample).toHaveBeenCalledTimes(2));
  });

  it("adds the sample again after a failed bootstrap", async () => {
    mocks.addSample.mockRejectedValueOnce(new Error("failed"));
    const { unmount } = renderHook(useSampleDeckBootstrap);
    await waitFor(() => expect(mocks.addSample).toHaveBeenCalledOnce());
    unmount();

    renderHook(useSampleDeckBootstrap);

    await waitFor(() => expect(mocks.addSample).toHaveBeenCalledTimes(2));
  });

  it("deduplicates concurrent starts for one user", async () => {
    let finish: () => void = () => undefined;
    mocks.addSample.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );

    renderHook(useSampleDeckBootstrap);
    renderHook(useSampleDeckBootstrap);

    await waitFor(() => expect(mocks.addSample).toHaveBeenCalledOnce());
    finish();
  });
});
