import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RemoteReadDependencies } from "@/query/reads/remoteReadController";

type InitializationState = { status: "ready" } | { status: "blocked"; error: Error };

const mocks = vi.hoisted(() => ({
  initializationState: { status: "ready" as const } as InitializationState,
  dependencies: undefined as RemoteReadDependencies | undefined,
  waitForInitialization: vi.fn<() => Promise<InitializationState>>(async () => ({ status: "ready" })),
  start: vi.fn(async () => undefined),
  stop: vi.fn(),
  retry: vi.fn(async () => undefined),
  subscribe: vi.fn(),
  getSnapshot: vi.fn(() => ({ uid: null, status: "idle" as const })),
  readDecks: vi.fn(),
  readCards: vi.fn(),
  subscribeDecks: vi.fn(),
  subscribeCards: vi.fn(),
}));

vi.mock("@/adapters/firestore", () => ({
  deck: { readAll: mocks.readDecks },
  card: { readAll: mocks.readCards },
  event: { subscribeDeckReads: mocks.subscribeDecks, subscribeCardReads: mocks.subscribeCards },
  getFirestoreInitializationState: () => mocks.initializationState,
  subscribeFirestoreInitialization: vi.fn(() => () => undefined),
  waitForFirestoreInitialization: mocks.waitForInitialization,
}));
vi.mock("@/query/client", () => ({ queryClient: {} }));
vi.mock("@/lib/realtimeChange", () => ({ applyRealtimeChange: vi.fn() }));
vi.mock("@/query/reads/remoteReadController", () => ({
  createRemoteReadController: vi.fn((dependencies: RemoteReadDependencies) => {
    mocks.dependencies = dependencies;
    return {
      start: mocks.start,
      stop: mocks.stop,
      retry: mocks.retry,
      subscribe: mocks.subscribe,
      getSnapshot: mocks.getSnapshot,
    };
  }),
}));

import { startRemoteReads, stopRemoteReads } from "@/query/reads/remoteReadSession";

describe("remote read session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.initializationState = { status: "ready" };
    mocks.waitForInitialization.mockResolvedValue({ status: "ready" });
  });

  it("connects production gateways to the Query controller", async () => {
    await startRemoteReads("uid-a");

    expect(mocks.start).toHaveBeenCalledWith("uid-a");
    stopRemoteReads("uid-a");
    expect(mocks.stop).toHaveBeenCalledWith("uid-a");
  });

  it("does not start listeners when persistent cache initialization is blocked", async () => {
    const error = new Error("another tab owns the cache");
    mocks.initializationState = { status: "blocked", error };
    mocks.waitForInitialization.mockResolvedValue({ status: "blocked", error });

    await startRemoteReads("uid-a");

    expect(mocks.start).not.toHaveBeenCalled();
  });

  it("does not start a stale UID after initialization finishes", async () => {
    let finishInitialization: (state: { status: "ready" }) => void = () => undefined;
    mocks.waitForInitialization.mockReturnValueOnce(
      new Promise((resolve) => {
        finishInitialization = resolve;
      })
    );

    const starting = startRemoteReads("uid-a");
    stopRemoteReads("uid-a");
    finishInitialization({ status: "ready" });
    await starting;

    expect(mocks.start).not.toHaveBeenCalled();
  });
});
