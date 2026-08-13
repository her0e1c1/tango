import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  startCards: vi.fn(),
  stopCards: vi.fn(),
  startDecks: vi.fn(),
  stopDecks: vi.fn(),
  startStudyProgresses: vi.fn(),
  stopStudyProgresses: vi.fn(),
}));

vi.mock("@/entities/card", () => ({
  startCardReads: mocks.startCards,
  stopCardReads: mocks.stopCards,
}));
vi.mock("@/entities/deck", () => ({
  startDeckReads: mocks.startDecks,
  stopDeckReads: mocks.stopDecks,
}));
vi.mock("@/entities/study-progress", () => ({
  startStudyProgressReads: mocks.startStudyProgresses,
  stopStudyProgressReads: mocks.stopStudyProgresses,
}));

import { startRemoteReads, stopRemoteReads } from "@/app/providers/remote-read/remoteReadLifecycle";

describe("remote read lifecycle", () => {
  beforeEach(() => vi.resetAllMocks());

  it("starts and stops every Entity read lifecycle", async () => {
    await startRemoteReads("uid-a");
    stopRemoteReads("uid-a");

    expect(mocks.startCards).toHaveBeenCalledExactlyOnceWith("uid-a");
    expect(mocks.startDecks).toHaveBeenCalledExactlyOnceWith("uid-a");
    expect(mocks.startStudyProgresses).toHaveBeenCalledExactlyOnceWith("uid-a");
    expect(mocks.stopCards).toHaveBeenCalledExactlyOnceWith("uid-a");
    expect(mocks.stopDecks).toHaveBeenCalledExactlyOnceWith("uid-a");
    expect(mocks.stopStudyProgresses).toHaveBeenCalledExactlyOnceWith("uid-a");
  });

  it("preserves each Entity state when one lifecycle reports a start failure", async () => {
    const failure = new Error("Deck reads failed");
    mocks.startDecks.mockRejectedValue(failure);

    await expect(startRemoteReads("uid-a")).resolves.toBeUndefined();

    expect(mocks.startCards).toHaveBeenCalledOnce();
    expect(mocks.startDecks).toHaveBeenCalledOnce();
    expect(mocks.startStudyProgresses).toHaveBeenCalledOnce();
    expect(mocks.stopCards).not.toHaveBeenCalled();
    expect(mocks.stopDecks).not.toHaveBeenCalled();
    expect(mocks.stopStudyProgresses).not.toHaveBeenCalled();

    stopRemoteReads("uid-a");

    expect(mocks.stopCards).toHaveBeenCalledExactlyOnceWith("uid-a");
    expect(mocks.stopDecks).toHaveBeenCalledExactlyOnceWith("uid-a");
    expect(mocks.stopStudyProgresses).toHaveBeenCalledExactlyOnceWith("uid-a");
  });
});
