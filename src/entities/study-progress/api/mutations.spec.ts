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

describe("StudyProgress mutations [SWIPE-02]", () => {
  beforeEach(() => vi.resetAllMocks());

  it("updates local Card progress without writing to Firestore", async () => {
    mocks.findCardById.mockReturnValue({ id: "local", deckId: "deck" });
    const untrustedProgress = {
      cardId: "local",
      difficulty: 2,
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
      difficulty: 2,
      numberOfSeen: 3,
    });
    expect(mocks.editRemoteStudyProgress).not.toHaveBeenCalled();
  });

  it("preserves remote Firestore progress writes", async () => {
    mocks.findCardById.mockReturnValue({ id: "remote", deckId: "deck", uid: "user" });

    await editStudyProgress("user", { cardId: "remote", difficulty: 2 });

    expect(mocks.editRemoteStudyProgress).toHaveBeenCalledExactlyOnceWith("user", {
      cardId: "remote",
      difficulty: 2,
    });
    expect(mocks.editLocalCardStudyProgress).not.toHaveBeenCalled();
  });

  it("rejects progress for an unknown Card", async () => {
    await expect(editStudyProgress("user", { cardId: "missing", difficulty: 2 })).rejects.toThrow(
      'Card "missing" was not found'
    );
    expect(mocks.editRemoteStudyProgress).not.toHaveBeenCalled();
    expect(mocks.editLocalCardStudyProgress).not.toHaveBeenCalled();
  });
});
