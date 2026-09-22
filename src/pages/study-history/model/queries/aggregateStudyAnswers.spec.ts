import { describe, expect, it } from "vitest";
import type { StudyAnswerHistory, StudyAnswerRecord } from "@/entities/study-answer";
import { aggregateStudyAnswers } from "./aggregateStudyAnswers";

const start = new Date(2026, 8, 21).getTime();
const end = new Date(2026, 8, 23).getTime();
const record = (id: string, rating: StudyAnswerRecord["rating"], answeredAt = start): StudyAnswerRecord => ({
  id,
  rating,
  answeredAt,
  deckId: "deck",
  sessionId: "session",
});
const history = (records: StudyAnswerRecord[], extra: Partial<StudyAnswerHistory> = {}): StudyAnswerHistory => ({
  records,
  source: "server",
  truncated: false,
  invalidCount: 0,
  hasPendingWrites: false,
  ...extra,
});
const aggregate = (value: StudyAnswerHistory) => aggregateStudyAnswers({ start, end }, value, new Set(["deck"]));

describe("STUDY-SESSION-13 answer metrics for the selected interval", () => {
  it("counts ratings, distinct answers at identical times, local days and session metrics", () => {
    const answers = [record("a", "again"), record("b", "hard"), record("c", "good"), record("d", "easy")];
    const result = aggregate(history(answers));
    const expected = {
      ratedAnswerCount: 4,
      recalledCount: 3,
      againCount: 1,
      hardCount: 1,
      goodCount: 1,
      easyCount: 1,
      recallRate: 0.75,
    };
    expect(result).toMatchObject({ ...expected, complete: true });
    expect(result.days).toEqual([
      { date: start, ...expected },
      {
        date: new Date(2026, 8, 22).getTime(),
        ratedAnswerCount: 0,
        recalledCount: 0,
        againCount: 0,
        hardCount: 0,
        goodCount: 0,
        easyCount: 0,
        recallRate: undefined,
      },
    ]);
    expect(result.sessions).toEqual([{ sessionId: "session", ...expected }]);
    expect(result.recentDecks).toEqual([{ deckId: "deck", lastAnsweredAt: start, ...expected }]);
  });
  it("does not infer zero recall from an empty or incomplete history", () => {
    expect(aggregate(history([]))).toMatchObject({ ratedAnswerCount: 0, recallRate: undefined, complete: true });
    for (const extra of [
      { source: "cache" as const },
      { truncated: true },
      { invalidCount: 1 },
      { hasPendingWrites: true },
    ]) {
      expect(aggregate(history([], extra))).toMatchObject({ recallRate: undefined, complete: false });
    }
  });
  it("excludes other Decks and half-open boundaries, deduplicating only identical IDs", () => {
    const first = record("a", "good");
    expect(
      aggregate(
        history([
          first,
          first,
          record("b", "good"),
          record("old", "again", start - 1),
          record("end", "again", end),
          { ...record("hidden", "again"), deckId: "hidden" },
        ])
      )
    ).toMatchObject({ ratedAnswerCount: 2, recallRate: 1 });
  });
});
