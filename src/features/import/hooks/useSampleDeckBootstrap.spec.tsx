import { renderHook, waitFor } from "@testing-library/react";
import { StrictMode, type ReactNode } from "react";
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

vi.mock("@/auth/AuthContext", () => ({ useAuth: () => mocks.auth }));
vi.mock("@/query/useRemoteCollections", () => ({ useRemoteCollections: () => mocks.remote }));
vi.mock("@/features/import/hooks/useDeckImport", () => ({
  useDeckImport: () => ({ addSample: mocks.addSample }),
}));

import {
  createSampleDeckBootstrapController,
  useSampleDeckBootstrap,
} from "@/features/import/hooks/useSampleDeckBootstrap";

const strictMode = ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>;

describe("sample Deck bootstrap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth = { status: "authenticated", uid: crypto.randomUUID() };
    mocks.remote = { status: "ready", syncStatus: "synced", decks: [] };
    mocks.addSample.mockResolvedValue(undefined);
  });

  it("adds the sample once for a server-synced empty user under StrictMode", async () => {
    renderHook(useSampleDeckBootstrap, { wrapper: strictMode });

    await waitFor(() => expect(mocks.addSample).toHaveBeenCalledOnce());
  });

  it("waits for the server before treating an empty cache as an empty user", async () => {
    mocks.remote.syncStatus = "cached";
    const { rerender } = renderHook(useSampleDeckBootstrap);

    expect(mocks.addSample).not.toHaveBeenCalled();
    mocks.remote.syncStatus = "synced";
    rerender();

    await waitFor(() => expect(mocks.addSample).toHaveBeenCalledOnce());
  });

  it("does not add the sample when the user already has a Deck", () => {
    mocks.remote.decks = [{ id: "existing" } as Deck];

    renderHook(useSampleDeckBootstrap);

    expect(mocks.addSample).not.toHaveBeenCalled();
  });

  it("deduplicates concurrent starts for one user", async () => {
    const controller = createSampleDeckBootstrapController();
    let finish!: () => void;
    const addSample = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));

    const first = controller.start("uid-a", addSample);
    const second = controller.start("uid-a", addSample);

    expect(first).toBe(second);
    expect(addSample).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(addSample).toHaveBeenCalledOnce();
    finish();
    await first;
  });
});
