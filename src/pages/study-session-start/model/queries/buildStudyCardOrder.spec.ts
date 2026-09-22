import { calculateFsrsState } from "@/entities/card-study-state";
import { describe, expect, it, vi } from "vitest";
import { buildStudyCardOrder } from "./buildStudyCardOrder";
const cardProgress = (id: string) => ({ id, fsrs: null });
describe("buildStudyCardOrder [STUDY-SESSION-01]", () => {
  const cards = [cardProgress("a"), cardProgress("b"), cardProgress("c"), cardProgress("d")];

  it("returns the source card order when shuffle and maximum are disabled", () => {
    expect(buildStudyCardOrder(cards, { shuffled: false, maxNumberOfCardsToLearn: 0 })).toEqual(["a", "b", "c", "d"]);
  });

  it("returns no card IDs for an empty selection", () => {
    expect(buildStudyCardOrder([], { shuffled: false, maxNumberOfCardsToLearn: 0 })).toEqual([]);
  });

  it("limits the number of cards", () => {
    expect(buildStudyCardOrder(cards, { shuffled: false, maxNumberOfCardsToLearn: 2 })).toEqual(["a", "b"]);
  });

  it("preserves source order before applying the maximum", () => {
    const unorderedCards = [cardProgress("seen"), cardProgress("new"), cardProgress("middle")];

    expect(buildStudyCardOrder(unorderedCards, { shuffled: false, maxNumberOfCardsToLearn: 2 })).toEqual([
      "seen",
      "new",
    ]);
  });

  it("returns every selected card exactly once when shuffled", () => {
    const result = buildStudyCardOrder(cards, { shuffled: true, maxNumberOfCardsToLearn: 0 });

    expect(result).toHaveLength(cards.length);
    expect(new Set(result)).toEqual(new Set(["a", "b", "c", "d"]));
  });

  it("limits a shuffled order to distinct selected cards", () => {
    const result = buildStudyCardOrder(cards, { shuffled: true, maxNumberOfCardsToLearn: 2 });

    expect(result).toHaveLength(2);
    expect(new Set(result).size).toBe(2);
    expect(result.every((id) => cards.some((card) => card.id === id))).toBe(true);
  });
});

describe("due ordering [STUDY-SESSION-01]", () => {
  const now = Date.parse("2026-09-21T00:00:00Z");
  const card = { id: "card", fsrs: null };
  const saved = calculateFsrsState(null, "good", now - 600_000);
  it.each([false, true])("limits the oldest due cards before shuffling=%s", (shuffled) => {
    const cards = [
      { ...card, id: "new" },
      { ...card, id: "equal", fsrs: { ...saved, dueAt: now } },
      { ...card, id: "oldest", fsrs: { ...saved, dueAt: now - 2 } },
      { ...card, id: "tie", fsrs: { ...saved, dueAt: now - 2 } },
      { ...card, id: "future", fsrs: { ...saved, dueAt: now + 1 } },
    ];
    expect(
      new Set(buildStudyCardOrder(cards, { useCardInterval: true, shuffled, maxNumberOfCardsToLearn: 2 }, now))
    ).toEqual(new Set(["oldest", "tie"]));
    expect(
      buildStudyCardOrder(cards, { useCardInterval: true, shuffled: false, maxNumberOfCardsToLearn: 0 }, now)
    ).toEqual(["oldest", "tie", "equal", "new"]);
    expect(
      buildStudyCardOrder(cards, { useCardInterval: false, shuffled: false, maxNumberOfCardsToLearn: 0 }, now)
    ).toEqual(cards.map(({ id }) => id));
  });
});

vi.mock("@/shared/firebase", () => ({ db: {} }));
