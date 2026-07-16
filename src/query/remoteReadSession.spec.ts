import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
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

vi.mock("@/action/firestore", () => ({
  deck: { readAll: mocks.readDecks },
  card: { readAll: mocks.readCards },
  event: { subscribeDeckReads: mocks.subscribeDecks, subscribeCardReads: mocks.subscribeCards },
}));
vi.mock("@/query/client", () => ({ queryClient: {} }));
vi.mock("@/lib/realtimeChange", () => ({ applyRealtimeChange: vi.fn() }));
vi.mock("@/query/remoteReadController", () => ({
  createRemoteReadController: vi.fn(() => {
    return {
      start: mocks.start,
      stop: mocks.stop,
      retry: mocks.retry,
      subscribe: mocks.subscribe,
      getSnapshot: mocks.getSnapshot,
    };
  }),
}));

import { startRemoteReads, stopRemoteReads } from "@/query/remoteReadSession";

describe("remote read session", () => {
  beforeEach(() => vi.clearAllMocks());

  it("connects production gateways to the Query controller", async () => {
    await startRemoteReads("uid-a");

    expect(mocks.start).toHaveBeenCalledWith("uid-a");
    stopRemoteReads("uid-a");
    expect(mocks.stop).toHaveBeenCalledWith("uid-a");
  });
});
