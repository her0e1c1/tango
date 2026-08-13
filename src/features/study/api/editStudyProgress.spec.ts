import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  doc: vi.fn(() => "card-reference"),
  getDb: vi.fn(() => "db"),
  getTimestamp: vi.fn(() => 100),
  updateDoc: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({ doc: mocks.doc, updateDoc: mocks.updateDoc }));
vi.mock("@/shared/firestore", () => ({
  getDb: mocks.getDb,
  getTimestamp: mocks.getTimestamp,
  omitUndefined: (value: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)),
}));

import { editStudyProgress } from "./editStudyProgress";

describe("editStudyProgress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateDoc.mockResolvedValue(undefined);
  });

  it("writes only StudyProgress fields when runtime input contains Card fields", async () => {
    const untrustedInput = {
      cardId: "card",
      score: 2,
      frontText: "unexpected",
      deckId: "other-deck",
      uid: "other-user",
      deletedAt: 1,
    } as unknown as Parameters<typeof editStudyProgress>[1];

    await editStudyProgress("uid-a", untrustedInput);

    expect(mocks.doc).toHaveBeenCalledWith("db", "card", "card");
    expect(mocks.updateDoc).toHaveBeenCalledWith("card-reference", { score: 2, updatedAt: 100 });
  });
});
