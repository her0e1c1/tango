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

describe("Study start and restart [STUDY-SESSION-01] [STUDY-SESSION-04]", () => {
  beforeEach(() => {
    clearStudySessions();
    persistence.create.mockReset().mockImplementation(async (session: import("../model/types").StudySession) => {
      await Promise.resolve();
      studySessionStore.setState((state) => {
        state.sessionsByDeckId[session.deckId] = session;
      });
    });
  });
  it("preserves the prior run and cursor when a replacement cannot be saved locally", async () => {
    const cardOrderIds = ["first", "second"];
    await startStudy({ deckId: "deck", cardOrderIds, uid: "owner" });
    await setStudySessionIndex("deck", 1);
    const previous = getStudySession("deck");
    const pending = Promise.withResolvers<void>();
    persistence.create.mockReturnValueOnce(pending.promise);
    const restart = startStudy({ deckId: "deck", cardOrderIds, uid: "owner" });
    expect(getStudySession("deck")).toEqual(previous);
    const rejected = restart.catch((error: unknown) => error);
    pending.reject(new Error("Persistence quota exceeded"));
    expect(await rejected).toEqual(new Error("Persistence quota exceeded"));
    expect(getStudySession("deck")).toEqual(previous);
    await startStudy({ deckId: "deck", cardOrderIds, uid: "owner" });
    expect(getStudySession("deck")).toMatchObject({ currentIndex: 0, cardOrderIds: ["first", "second"] });
    expect(getStudySession("deck")?.sessionId).not.toBe(previous?.sessionId);
  });
  it("starts at index zero with the configured card order", async () => {
    const cardOrderIds = ["third", "second"];
    await startStudy({ deckId: "deck", cardOrderIds, uid: "owner" });

    expect(getStudySession("deck")?.currentIndex).toBe(0);
    expect(getStudySession("deck")?.cardOrderIds).toEqual(["third", "second"]);
  });

  it("copies the card order into the session", async () => {
    const cardOrderIds = ["first", "second"];
    await startStudy({ deckId: "deck", cardOrderIds, uid: "owner" });
    cardOrderIds.reverse();

    expect(getStudySession("deck")?.cardOrderIds).toEqual(["first", "second"]);
  });
});
