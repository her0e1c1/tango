import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  startCards: vi.fn(),
  stopCards: vi.fn(),
  startDecks: vi.fn(),
  stopDecks: vi.fn(),
}));

vi.mock("@/features/card/read", () => ({
  startCardReads: mocks.startCards,
  stopCardReads: mocks.stopCards,
}));
vi.mock("@/app/providers/remote-read/deckReadStore", () => ({
  startDeckReads: mocks.startDecks,
  stopDeckReads: mocks.stopDecks,
}));

import { startRemoteReads, stopRemoteReads } from "@/app/providers/remote-read/remoteReadLifecycle";

describe("remote read lifecycle", () => {
  beforeEach(() => vi.resetAllMocks());

  it("starts and stops both remote read lifecycles", () => {
    startRemoteReads("uid-a");
    stopRemoteReads("uid-a");

    expect(mocks.startCards).toHaveBeenCalledExactlyOnceWith("uid-a");
    expect(mocks.startDecks).toHaveBeenCalledExactlyOnceWith("uid-a");
    expect(mocks.stopCards).toHaveBeenCalledExactlyOnceWith("uid-a");
    expect(mocks.stopDecks).toHaveBeenCalledExactlyOnceWith("uid-a");
  });
});
