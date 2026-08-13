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
vi.mock("@/features/deck/read", () => ({
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

  it("preserves each Entity state when one lifecycle reports a start failure", async () => {
    const failure = new Error("Deck reads failed");
    mocks.startDecks.mockRejectedValue(failure);

    await expect(startRemoteReads("uid-a")).resolves.toBeUndefined();

    expect(mocks.startCards).toHaveBeenCalledOnce();
    expect(mocks.startDecks).toHaveBeenCalledOnce();
    expect(mocks.stopCards).not.toHaveBeenCalled();
    expect(mocks.stopDecks).not.toHaveBeenCalled();

    stopRemoteReads("uid-a");

    expect(mocks.stopCards).toHaveBeenCalledExactlyOnceWith("uid-a");
    expect(mocks.stopDecks).toHaveBeenCalledExactlyOnceWith("uid-a");
  });
});
