/**
 * @file Verifies the "sample Deck bootstrap" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "adds the sample once for a
 * server-confirmed empty user under StrictMode", "waits for the server before treating an empty cache
 * as an empty user", "does not add the sample when the user already has a Deck".
 */

import type { Deck, DeckCreateInput } from "@/entities/deck";

import { renderHook, waitFor } from "@testing-library/react";
import React, { type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: { status: "authenticated", uid: "uid-a" } as { status: "authenticated"; uid: string } | { status: "loading" },
  fetchDecks: vi.fn<(uid: string) => Promise<Deck[]>>(),
  createDeck: vi.fn<(uid: string, deck: DeckCreateInput) => Promise<unknown>>(),
  bulkUpsert: vi.fn(),
}));

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/entities/auth", () => ({ useAuthSession: () => mocks.auth }));
vi.mock("@/entities/card", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/card")>();
  return {
    ...actual,
    fetchCards: vi.fn(async () => []),
  };
});
vi.mock("@/entities/deck", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/deck")>();
  return {
    ...actual,
    fetchDecks: (uid: string) => mocks.fetchDecks(uid),
  };
});
vi.mock("../api/upsertImportedCards", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/upsertImportedCards")>();
  return {
    ...actual,
    upsertImportedCards: (_uid: string, cards: unknown[]) => mocks.bulkUpsert(cards),
  };
});

import { useSampleDeckBootstrap } from "./useSampleDeckBootstrap";

const useTestSampleDeckBootstrap = (localDecks: Deck[] = []) =>
  useSampleDeckBootstrap({
    cards: [],
    createCard: vi.fn(),
    createDeck: mocks.createDeck,
    decks: localDecks,
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
    mocks.fetchDecks.mockResolvedValue([]);
    mocks.createDeck.mockResolvedValue(undefined);
    mocks.bulkUpsert.mockResolvedValue(undefined);
  });

  it("adds the sample once for a server-confirmed empty user under StrictMode", async () => {
    renderHook(() => useTestSampleDeckBootstrap([]), { wrapper: strictMode });

    await waitFor(() => expect(mocks.createDeck).toHaveBeenCalledOnce());
    expect(mocks.fetchDecks).toHaveBeenCalled();
  });

  it("does not add the sample when remote Decks exist during the initial empty cache loading window", async () => {
    mocks.fetchDecks.mockResolvedValue([{ id: "existing-remote-deck" } as Deck]);

    renderHook(() => useTestSampleDeckBootstrap([]));

    await waitFor(() => expect(mocks.fetchDecks).toHaveBeenCalled());
    expect(mocks.createDeck).not.toHaveBeenCalled();
    expect(mocks.bulkUpsert).not.toHaveBeenCalled();
  });

  it("does not trigger remote read when the local store already has a Deck", () => {
    renderHook(() => useTestSampleDeckBootstrap([{ id: "local-deck" } as Deck]));

    expect(mocks.fetchDecks).not.toHaveBeenCalled();
    expect(mocks.createDeck).not.toHaveBeenCalled();
  });

  it("deduplicates concurrent starts for one user", async () => {
    let finish!: (decks: Deck[]) => void;
    mocks.fetchDecks.mockImplementation(() => new Promise((resolve) => (finish = resolve)));

    renderHook(() => useTestSampleDeckBootstrap([]));
    renderHook(() => useTestSampleDeckBootstrap([]));

    await waitFor(() => expect(mocks.fetchDecks).toHaveBeenCalled());
    finish([]);
    await waitFor(() => expect(mocks.createDeck).toHaveBeenCalledOnce());
  });

  it("does not add the sample when remote Deck read fails", async () => {
    mocks.fetchDecks.mockRejectedValue(new Error("Network error"));

    renderHook(() => useTestSampleDeckBootstrap([]));

    await waitFor(() => expect(mocks.fetchDecks).toHaveBeenCalled());
    expect(mocks.createDeck).not.toHaveBeenCalled();
  });
});
