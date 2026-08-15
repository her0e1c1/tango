import type { Deck, DeckCreateInput } from "@/entities/deck";

import { renderHook, waitFor } from "@testing-library/react";
import React, { type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: { status: "authenticated", uid: "uid-a" } as { status: "authenticated"; uid: string } | { status: "loading" },
  remote: {
    decks: [] as Deck[],
  },
  addSample: vi.fn<() => Promise<unknown>>(),
  fetchDecks: vi.fn<(uid: string) => Promise<Deck[]>>(),
}));

vi.mock("@/entities/auth", () => ({ useAuthSession: () => mocks.auth }));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("./useDeckImport", () => ({
  useDeckImport: () => ({ addSample: mocks.addSample }),
}));

import { useSampleDeckBootstrap } from "./useSampleDeckBootstrap";

const createDeck = vi.fn<(uid: string, deck: DeckCreateInput) => Promise<unknown>>();
const useTestSampleDeckBootstrap = () =>
  useSampleDeckBootstrap({
    cards: [],
    createCard: vi.fn(),
    createDeck,
    decks: mocks.remote.decks,
    editCard: vi.fn(),
    generateCardId: vi.fn(() => "card-id"),
    fetchDecks: mocks.fetchDecks,
  });

/**
 * Provides the strict mode test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
const strictMode = ({ children }: { children: ReactNode }) => <React.StrictMode>{children}</React.StrictMode>;

describe("sample Deck bootstrap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth = { status: "authenticated", uid: crypto.randomUUID() };
    mocks.remote = { decks: [] };
    mocks.addSample.mockResolvedValue(undefined);
    mocks.fetchDecks.mockResolvedValue([]);
  });

  it("adds the sample once for a remote-confirmed empty user under StrictMode", async () => {
    renderHook(useTestSampleDeckBootstrap, { wrapper: strictMode });

    await waitFor(() => expect(mocks.addSample).toHaveBeenCalledOnce());
    expect(mocks.fetchDecks).toHaveBeenCalledWith(mocks.auth.status === "authenticated" ? mocks.auth.uid : "");
  });

  it("does not add the sample when the user already has a Deck in local cache", () => {
    mocks.remote.decks = [{ id: "existing" } as Deck];

    renderHook(useTestSampleDeckBootstrap);

    expect(mocks.fetchDecks).not.toHaveBeenCalled();
    expect(mocks.addSample).not.toHaveBeenCalled();
  });

  it("does not add the sample when the user has remote Decks during the loading window", async () => {
    mocks.remote.decks = [];
    mocks.fetchDecks.mockResolvedValue([{ id: "remote-deck" } as Deck]);

    renderHook(useTestSampleDeckBootstrap);

    await waitFor(() =>
      expect(mocks.fetchDecks).toHaveBeenCalledWith(mocks.auth.status === "authenticated" ? mocks.auth.uid : "")
    );
    expect(mocks.addSample).not.toHaveBeenCalled();
  });

  it("does not add the sample if remote deck fetch fails", async () => {
    mocks.remote.decks = [];
    mocks.fetchDecks.mockRejectedValue(new Error("Network error"));

    renderHook(useTestSampleDeckBootstrap);

    await waitFor(() =>
      expect(mocks.fetchDecks).toHaveBeenCalledWith(mocks.auth.status === "authenticated" ? mocks.auth.uid : "")
    );
    expect(mocks.addSample).not.toHaveBeenCalled();
  });

  it("deduplicates concurrent starts for one user", async () => {
    let finish: () => void = () => undefined;
    mocks.fetchDecks.mockImplementation(
      () =>
        new Promise<Deck[]>((resolve) => {
          finish = () => resolve([]);
        })
    );

    renderHook(useTestSampleDeckBootstrap);
    renderHook(useTestSampleDeckBootstrap);

    expect(mocks.fetchDecks).toHaveBeenCalledOnce();
    finish();
    await waitFor(() => expect(mocks.addSample).toHaveBeenCalledOnce());
  });
});
