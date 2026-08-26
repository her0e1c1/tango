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

describe("StudyProgress mutations", () => {
  beforeEach(() => vi.resetAllMocks());

  it("updates local Card progress without writing to Firestore", async () => {
    mocks.findCardById.mockReturnValue({ id: "local", deckId: "deck" });

    await editStudyProgress("", { cardId: "local", score: 2, numberOfSeen: 3 });

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

  it("rejects progress for an unknown Card", async () => {
    await expect(editStudyProgress("user", { cardId: "missing", score: 2 })).rejects.toThrow(
      'Card "missing" was not found'
    );
    expect(mocks.editRemoteStudyProgress).not.toHaveBeenCalled();
    expect(mocks.editLocalCardStudyProgress).not.toHaveBeenCalled();
  });
});
