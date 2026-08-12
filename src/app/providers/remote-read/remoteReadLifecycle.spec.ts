import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  startCards: vi.fn(),
  stopCards: vi.fn(),
  startDecks: vi.fn(),
  stopDecks: vi.fn(),
}));

vi.mock("@/entities/card", () => ({
  startCardReads: mocks.startCards,
  stopCardReads: mocks.stopCards,
}));
vi.mock("@/entities/deck", () => ({
  startDeckReads: mocks.startDecks,
  stopDeckReads: mocks.stopDecks,
}));

import { startRemoteReads, stopRemoteReads } from "@/app/providers/remote-read/remoteReadLifecycle";

describe("remote read lifecycle", () => {
  beforeEach(() => vi.resetAllMocks());

  it("starts and stops both Entity read lifecycles", async () => {
    await startRemoteReads("uid-a");
    stopRemoteReads("uid-a");

    expect(mocks.startCards).toHaveBeenCalledExactlyOnceWith("uid-a");
    expect(mocks.startDecks).toHaveBeenCalledExactlyOnceWith("uid-a");
    expect(mocks.stopCards).toHaveBeenCalledExactlyOnceWith("uid-a");
    expect(mocks.stopDecks).toHaveBeenCalledExactlyOnceWith("uid-a");
  });

  it("rolls back both Entity stores before publishing a start failure", async () => {
    const failure = new Error("Deck reads failed");
    mocks.startDecks.mockRejectedValue(failure);
    mocks.stopCards.mockImplementation(() => {
      throw new Error("Card cleanup failed");
    });

    await expect(startRemoteReads("uid-a")).rejects.toBe(failure);

    expect(mocks.startCards).toHaveBeenCalledOnce();
    expect(mocks.startDecks).toHaveBeenCalledOnce();
    expect(mocks.stopCards).toHaveBeenCalledExactlyOnceWith("uid-a");
    expect(mocks.stopDecks).toHaveBeenCalledExactlyOnceWith("uid-a");
  });
});
