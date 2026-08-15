import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCard, createLocalCard } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  editLocalStudyProgress: vi.fn(),
  editRemoteStudyProgress: vi.fn(),
  findCardById: vi.fn(),
}));

vi.mock("@/entities/card/@x/study-progress", () => ({ findCardById: mocks.findCardById }));
vi.mock("../model/store", () => ({ editLocalStudyProgress: mocks.editLocalStudyProgress }));
vi.mock("./firestore", () => ({ editRemoteStudyProgress: mocks.editRemoteStudyProgress }));

import { editStudyProgress } from "./mutations";

describe("StudyProgress mutations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("persists local Card progress without requiring an authenticated UID", async () => {
    const card = createLocalCard({ id: "local" });
    const progress = { cardId: card.id, score: 2 };
    mocks.findCardById.mockReturnValue(card);

    await editStudyProgress("", progress);

    expect(mocks.editLocalStudyProgress).toHaveBeenCalledExactlyOnceWith(progress);
    expect(mocks.editRemoteStudyProgress).not.toHaveBeenCalled();
  });

  it("routes remote Card progress to Firestore", async () => {
    const card = createCard({ id: "remote" });
    const progress = { cardId: card.id, score: 2 };
    mocks.findCardById.mockReturnValue(card);

    await editStudyProgress("uid", progress);

    expect(mocks.editRemoteStudyProgress).toHaveBeenCalledExactlyOnceWith("uid", progress);
    expect(mocks.editLocalStudyProgress).not.toHaveBeenCalled();
  });

  it("fails when the progress Card invariant is broken", async () => {
    mocks.findCardById.mockReturnValue(undefined);

    await expect(editStudyProgress("uid", { cardId: "missing", score: 2 })).rejects.toThrow(
      'Card "missing" was not found'
    );
  });
});
