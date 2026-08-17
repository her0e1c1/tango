import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  editLocalStudyProgress: vi.fn(),
  editRemoteStudyProgress: vi.fn(),
  findCardById: vi.fn(),
}));

vi.mock("@/entities/card/@x/study-progress", () => ({
  findCardById: mocks.findCardById,
}));
vi.mock("../model/store", () => ({ editLocalStudyProgress: mocks.editLocalStudyProgress }));
vi.mock("./firestore", () => ({ editRemoteStudyProgress: mocks.editRemoteStudyProgress }));

import { editStudyProgress } from "./mutations";

describe("StudyProgress mutations", () => {
  beforeEach(() => vi.resetAllMocks());

  it("updates local state without writing to Firestore", async () => {
    mocks.findCardById.mockReturnValue({ id: "local", deckId: "deck" });
    await editStudyProgress("", { cardId: "local", score: 2 });

    expect(mocks.editLocalStudyProgress).toHaveBeenCalledExactlyOnceWith({ cardId: "local", score: 2 });
    expect(mocks.editRemoteStudyProgress).not.toHaveBeenCalled();
  });

  it("preserves the remote Firestore write path", async () => {
    mocks.findCardById.mockReturnValue({ id: "remote", deckId: "deck", uid: "user" });

    await editStudyProgress("user", { cardId: "remote", score: 2 });

    expect(mocks.editRemoteStudyProgress).toHaveBeenCalledExactlyOnceWith("user", {
      cardId: "remote",
      score: 2,
    });
    expect(mocks.editLocalStudyProgress).not.toHaveBeenCalled();
  });

  it("rejects progress for an unknown Card", async () => {
    await expect(editStudyProgress("user", { cardId: "missing", score: 2 })).rejects.toThrow(
      'Card "missing" was not found'
    );
    expect(mocks.editRemoteStudyProgress).not.toHaveBeenCalled();
    expect(mocks.editLocalStudyProgress).not.toHaveBeenCalled();
  });
});
