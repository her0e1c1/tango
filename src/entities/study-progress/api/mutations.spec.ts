import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  editRemoteStudyProgress: vi.fn(),
  findCardById: vi.fn(),
}));

vi.mock("@/entities/card/@x/study-progress", () => ({
  findCardById: mocks.findCardById,
}));
vi.mock("./firestore", () => ({ editRemoteStudyProgress: mocks.editRemoteStudyProgress }));

import { editStudyProgress } from "./mutations";

describe("StudyProgress mutations [STUDY-ACTIONS-01]", () => {
  beforeEach(() => vi.resetAllMocks());

  it("uses Firestore for anonymous Card progress too", async () => {
    mocks.findCardById.mockReturnValue({ id: "card", deckId: "deck", uid: "anonymous" });
    await editStudyProgress("anonymous", { cardId: "card", difficulty: 2, numberOfSeen: 3 });
    expect(mocks.editRemoteStudyProgress).toHaveBeenCalledWith("anonymous", {
      cardId: "card",
      difficulty: 2,
      numberOfSeen: 3,
    });
  });

  it("preserves remote Firestore progress writes", async () => {
    mocks.findCardById.mockReturnValue({ id: "remote", deckId: "deck", uid: "user" });

    await editStudyProgress("user", { cardId: "remote", difficulty: 2 });

    expect(mocks.editRemoteStudyProgress).toHaveBeenCalledExactlyOnceWith("user", {
      cardId: "remote",
      difficulty: 2,
    });
  });

  it("rejects progress for an unknown Card", async () => {
    await expect(editStudyProgress("user", { cardId: "missing", difficulty: 2 })).rejects.toThrow(
      'Card "missing" was not found'
    );
    expect(mocks.editRemoteStudyProgress).not.toHaveBeenCalled();
  });
});
