import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearStudySessions } from "../model/actions/clearStudySessions";
import { getStudySession } from "../model/queries/getStudySession";
import { startStudy, setStudySessionIndex } from "./mutations";
import { studySessionStore } from "../model/store";

vi.mock("@/entities/auth/@x/study-session", () => ({ getAuthUid: () => "owner" }));

const persistence = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("./firestore", () => ({
  createStudySession: persistence.create,
  updateStudySession: async (session: import("../model/types").StudySession) => {
    await Promise.resolve();
    studySessionStore.setState((state) => {
      state.sessionsByDeckId[session.deckId] = session;
    });
  },
}));

describe("Study restart failure [SWIPE-09]", () => {
  beforeEach(() => {
    clearStudySessions();
    persistence.create.mockReset().mockResolvedValue(undefined);
  });
  it("preserves the prior run and cursor when a replacement cannot be saved locally", async () => {
    const cards = [
      { id: "first", difficulty: 5, numberOfSeen: 0 },
      { id: "second", difficulty: 5, numberOfSeen: 0 },
    ];
    const preferences = { shuffled: false, maxNumberOfCardsToLearn: 0 };
    await startStudy("deck", cards, preferences, "owner");
    await setStudySessionIndex("deck", 1);
    const previous = getStudySession("deck");
    persistence.create.mockRejectedValueOnce(new Error("Persistence quota exceeded"));
    await expect(startStudy("deck", cards, preferences, "owner")).rejects.toThrow("Persistence quota exceeded");
    expect(getStudySession("deck")).toEqual(previous);
    await startStudy("deck", cards, preferences, "owner");
    expect(getStudySession("deck")).toMatchObject({ currentIndex: 0, cardOrderIds: ["first", "second"] });
    expect(getStudySession("deck")?.sessionId).not.toBe(previous?.sessionId);
  });
});
