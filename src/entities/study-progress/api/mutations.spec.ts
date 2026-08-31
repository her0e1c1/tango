import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  editLocalCardStudyProgress: vi.fn(),
  editRemoteStudyProgress: vi.fn(),
  findCardById: vi.fn(),
}));

vi.mock("@/entities/card/@x/study-progress", () => ({
  editLocalCardStudyProgress: mocks.editLocalCardStudyProgress,
  findCardById: mocks.findCardById,
}));
vi.mock("./firestore", () => ({ editRemoteStudyProgress: mocks.editRemoteStudyProgress }));

import { editStudyProgress } from "./mutations";

describe("SWIPE-27 SWIPE-28 SWIPE-29 StudyProgress mutations", () => {
  beforeEach(() => vi.resetAllMocks());

  it("updates local Card progress without writing to Firestore", async () => {
    mocks.findCardById.mockReturnValue({ id: "local", deckId: "deck" });
    const untrustedProgress = {
      cardId: "local",
      score: 2,
      numberOfSeen: 3,
      id: "other-local",
      frontText: "unexpected",
      deckId: "other-deck",
      uid: "other-user",
      deletedAt: 1,
    } as unknown as Parameters<typeof editStudyProgress>[1];

    await editStudyProgress("", untrustedProgress);

    expect(mocks.findCardById).toHaveBeenCalledExactlyOnceWith("local");
    expect(mocks.editLocalCardStudyProgress).toHaveBeenCalledExactlyOnceWith({
      id: "local",
      score: 2,
      numberOfSeen: 3,
    });
    expect(mocks.editRemoteStudyProgress).not.toHaveBeenCalled();
  });

  it("preserves remote Firestore progress writes", async () => {
    mocks.findCardById.mockReturnValue({ id: "remote", deckId: "deck", uid: "user" });

    await editStudyProgress("user", { cardId: "remote", score: 2 });

    expect(mocks.editRemoteStudyProgress).toHaveBeenCalledExactlyOnceWith("user", {
      cardId: "remote",
      score: 2,
    });
    expect(mocks.editLocalCardStudyProgress).not.toHaveBeenCalled();
  });

  it("writes progress for a verified remote Card before the Card store catches up", async () => {
    await editStudyProgress("user", { cardId: "remote", score: 2 }, { persistence: "remote", cardId: "remote" });

    expect(mocks.findCardById).not.toHaveBeenCalled();
    expect(mocks.editRemoteStudyProgress).toHaveBeenCalledExactlyOnceWith("user", {
      cardId: "remote",
      score: 2,
    });
    expect(mocks.editLocalCardStudyProgress).not.toHaveBeenCalled();
  });

  it("writes progress for a resolved local Card despite an ambiguous global lookup", async () => {
    mocks.findCardById.mockReturnValue({ id: "local", deckId: "deck", uid: "user" });

    await editStudyProgress("user", { cardId: "local", score: 2 }, { persistence: "local", cardId: "local" });

    expect(mocks.findCardById).not.toHaveBeenCalled();
    expect(mocks.editLocalCardStudyProgress).toHaveBeenCalledExactlyOnceWith({ id: "local", score: 2 });
    expect(mocks.editRemoteStudyProgress).not.toHaveBeenCalled();
  });

  it("rejects a resolved persistence identity for another Card", async () => {
    await expect(
      editStudyProgress("user", { cardId: "remote", score: 2 }, { persistence: "remote", cardId: "other-card" })
    ).rejects.toThrow("Resolved Card identity does not match progress");

    expect(mocks.editRemoteStudyProgress).not.toHaveBeenCalled();
    expect(mocks.editLocalCardStudyProgress).not.toHaveBeenCalled();
  });

  it("rejects progress for an unknown Card", async () => {
    await expect(editStudyProgress("user", { cardId: "missing", score: 2 })).rejects.toThrow(
      'Card "missing" was not found'
    );
    expect(mocks.editRemoteStudyProgress).not.toHaveBeenCalled();
    expect(mocks.editLocalCardStudyProgress).not.toHaveBeenCalled();
  });
});
