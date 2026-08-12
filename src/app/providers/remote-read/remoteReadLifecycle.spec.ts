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
  beforeEach(() => vi.clearAllMocks());

  it("starts and stops both Entity read lifecycles", async () => {
    await startRemoteReads("uid-a");
    await stopRemoteReads("uid-a");

    expect(mocks.startCards).toHaveBeenCalledExactlyOnceWith("uid-a");
    expect(mocks.startDecks).toHaveBeenCalledExactlyOnceWith("uid-a");
    expect(mocks.stopCards).toHaveBeenCalledExactlyOnceWith("uid-a");
    expect(mocks.stopDecks).toHaveBeenCalledExactlyOnceWith("uid-a");
  });

  it("attempts both Entity actions before publishing a failure", async () => {
    const failure = new Error("Card reads failed");
    mocks.startCards.mockRejectedValue(failure);

    await expect(startRemoteReads("uid-a")).rejects.toBe(failure);

    expect(mocks.startCards).toHaveBeenCalledOnce();
    expect(mocks.startDecks).toHaveBeenCalledOnce();
  });
});
