import { Timestamp } from "firebase/firestore";
import { describe, expect, it, vi } from "vitest";
import { studyAnswerDocumentSchema } from "./studyAnswerDocument";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

const document = {
  uid: "learner",
  sessionId: "session",
  deckId: "deck",
  cardId: "card",
  answer: { type: "rating", rating: "good" },
  answeredAt: Timestamp.fromMillis(1000),
  createdAt: Timestamp.fromMillis(2000),
  updatedAt: Timestamp.fromMillis(2000),
};

describe("StudyAnswer document contract [STUDY-ACTIONS-01] [STUDY-ACTIONS-02] [STUDY-ACTIONS-05]", () => {
  it.each(["again", "hard", "good", "easy"])(
    "preserves the accepted %s rating and separate domain and persistence timestamps",
    (rating) => {
      const value = { ...document, answer: { type: "rating", rating } };
      expect(studyAnswerDocumentSchema.parse(value)).toEqual(value);
    }
  );

  it.each([
    "good",
    { type: "rating" },
    { type: "rating", rating: "mastered" },
    { type: "rating", rating: "not-mastered" },
    { type: "rating", rating: "unrated" },
    { type: "text", text: "word" },
    { type: "choice", optionId: "a" },
    { type: "rating", rating: "good", isCorrect: true },
  ])("rejects unsupported or incomplete answers %j", (answer) => {
    expect(studyAnswerDocumentSchema.safeParse({ ...document, answer }).success).toBe(false);
  });

  it.each(["uid", "sessionId", "deckId", "cardId", "answer", "answeredAt", "createdAt", "updatedAt"] as const)(
    "requires %s",
    (field) => {
      const value = Object.fromEntries(Object.entries(document).filter(([key]) => key !== field));
      expect(studyAnswerDocumentSchema.safeParse(value).success).toBe(false);
    }
  );

  it("rejects unsettled timestamps and fields reserved for future grading", () => {
    expect(studyAnswerDocumentSchema.safeParse({ ...document, createdAt: null }).success).toBe(false);
    expect(studyAnswerDocumentSchema.safeParse({ ...document, isCorrect: null }).success).toBe(false);
  });
});
