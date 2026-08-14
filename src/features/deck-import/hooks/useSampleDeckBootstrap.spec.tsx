/**
 * @file Verifies the "sample Deck bootstrap" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "adds the sample once for a
 * signed-in user under StrictMode" and "does not start before authentication".
 */

import type { DeckCreateInput } from "@/entities/deck";

import { renderHook, waitFor } from "@testing-library/react";
import React, { type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: { status: "authenticated", uid: "uid-a" } as { status: "authenticated"; uid: string } | { status: "loading" },
  addSample: vi.fn<() => Promise<unknown>>(),
}));

vi.mock("@/entities/auth", () => ({ useAuthSession: () => mocks.auth }));
vi.mock("./useDeckImport", () => ({
  useDeckImport: () => ({ addSample: mocks.addSample }),
}));

import { useSampleDeckBootstrap } from "./useSampleDeckBootstrap";

const createDeck = vi.fn<(uid: string, deck: DeckCreateInput) => Promise<unknown>>();
const useTestSampleDeckBootstrap = () =>
  useSampleDeckBootstrap({
    createCard: vi.fn(),
    createDeck,
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
    mocks.addSample.mockResolvedValue(undefined);
  });

  it("starts the server-backed sample import once under StrictMode", async () => {
    renderHook(useTestSampleDeckBootstrap, { wrapper: strictMode });

    await waitFor(() => expect(mocks.addSample).toHaveBeenCalledOnce());
  });

  it("does not start before authentication", () => {
    mocks.auth = { status: "loading" };
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
