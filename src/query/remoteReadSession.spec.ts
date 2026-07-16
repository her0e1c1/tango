import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  dependencies: undefined as
    | {
        mirrorDecks: (decks: Deck[]) => void;
        mirrorCards: (cards: Card[]) => void;
      }
    | undefined,
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
  createRemoteReadController: vi.fn((dependencies) => {
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

import { startRemoteReads, stopRemoteReads } from "@/query/remoteReadSession";
import { createCard, createDeck } from "@/test/factories";

describe("remote read session", () => {
  beforeEach(() => vi.clearAllMocks());

  it("connects production gateways and forwards controller snapshots to the active mirrors", async () => {
    const mirrorDecks = vi.fn();
    const mirrorCards = vi.fn();
    const deck = createDeck();
    const card = createCard();

    await startRemoteReads("uid-a", { mirrorDecks, mirrorCards });
    mocks.dependencies?.mirrorDecks([deck]);
    mocks.dependencies?.mirrorCards([card]);

    expect(mocks.start).toHaveBeenCalledWith("uid-a");
    expect(mirrorDecks).toHaveBeenCalledWith([deck]);
    expect(mirrorCards).toHaveBeenCalledWith([card]);
    stopRemoteReads("uid-a");
    expect(mocks.stop).toHaveBeenCalledWith("uid-a");
  });
});
