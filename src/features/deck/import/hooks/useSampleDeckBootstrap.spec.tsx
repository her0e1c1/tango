/**
 * @file Verifies the "sample Deck bootstrap" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "adds the sample once for a
 * server-synced empty user under StrictMode", "waits for the server before treating an empty cache
 * as an empty user", "does not add the sample when the user already has a Deck".
 */

import type { Deck } from "@/entities/deck";

import { renderHook, waitFor } from "@testing-library/react";
import React, { type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: { status: "authenticated", uid: "uid-a" } as { status: "authenticated"; uid: string } | { status: "loading" },
  remote: {
    status: "ready" as "idle" | "loading" | "ready" | "error" | "blocked",
    syncStatus: "synced" as "cached" | "pending" | "synced" | undefined,
    decks: [] as Deck[],
  },
  addSample: vi.fn<() => Promise<unknown>>(),
}));

vi.mock("@/entities/auth-session", () => ({ useAuthSession: () => mocks.auth }));
vi.mock("./useDeckImport", () => ({
  useDeckImport: () => ({ addSample: mocks.addSample }),
}));

import { useSampleDeckBootstrap } from "./useSampleDeckBootstrap";

const createDeck = vi.fn<(uid: string, deck: Deck) => Promise<unknown>>();
const useTestSampleDeckBootstrap = () =>
  useSampleDeckBootstrap({
    cardRead: { status: "ready", syncStatus: "synced", cards: [] },
    createCard: vi.fn(),
    createDeck,
    deckRead: mocks.remote,
    editCard: vi.fn(),
    generateCardId: vi.fn(() => "card-id"),
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
    mocks.remote = { status: "ready", syncStatus: "synced", decks: [] };
    mocks.addSample.mockResolvedValue(undefined);
  });

  it("adds the sample once for a server-synced empty user under StrictMode", async () => {
    renderHook(useTestSampleDeckBootstrap, { wrapper: strictMode });

    await waitFor(() => expect(mocks.addSample).toHaveBeenCalledOnce());
  });

  it("waits for the server before treating an empty cache as an empty user", async () => {
    mocks.remote.syncStatus = "cached";
    const { rerender } = renderHook(useTestSampleDeckBootstrap);

    expect(mocks.addSample).not.toHaveBeenCalled();
    mocks.remote.syncStatus = "synced";
    rerender();

    await waitFor(() => expect(mocks.addSample).toHaveBeenCalledOnce());
  });

  it("does not add the sample when the user already has a Deck", () => {
    mocks.remote.decks = [{ id: "existing" } as Deck];

    renderHook(useTestSampleDeckBootstrap);

    expect(mocks.addSample).not.toHaveBeenCalled();
  });

  it("deduplicates concurrent starts for one user", async () => {
    let finish: () => void = () => undefined;
    mocks.addSample.mockImplementation(() => new Promise<void>((resolve) => (finish = resolve)));

    renderHook(useTestSampleDeckBootstrap);
    renderHook(useTestSampleDeckBootstrap);

    await waitFor(() => expect(mocks.addSample).toHaveBeenCalledOnce());
    finish();
  });
});
