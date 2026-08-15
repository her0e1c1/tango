import type { StudyPreferences } from "@/entities/preferences";

import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

const mocks = vi.hoisted(() => ({ shuffle: vi.fn((ids: string[]) => [...ids].reverse()) }));

vi.mock("lodash", () => ({ shuffle: mocks.shuffle }));

import { createCard, createStudyProgress } from "@/test/factories";
import { buildStudyCardOrder } from "./buildStudyCardOrder";

describe("buildStudyCardOrder", () => {
  const makeCard = (id: string, numberOfSeen = 0) => {
    const card = createCard({ id });
    return { card, progress: createStudyProgress({ cardId: card.id, numberOfSeen }) };
  };
  const cards = [makeCard("a"), makeCard("b"), makeCard("c"), makeCard("d")];

  it("returns a copied card order when shuffle and maximum are disabled", () => {
    const study = { shuffled: false, maxNumberOfCardsToLearn: 0 } as StudyPreferences;
    const result = buildStudyCardOrder(cards, study);
    expect(result).toEqual(["a", "b", "c", "d"]);
    expect(result).not.toBe(cards);
  });

  it("returns no card IDs for an empty selection", () => {
    expect(buildStudyCardOrder([], { shuffled: false, maxNumberOfCardsToLearn: 0 })).toEqual([]);
  });

  it("limits the number of cards", () => {
    expect(buildStudyCardOrder(cards, { shuffled: false, maxNumberOfCardsToLearn: 2 })).toEqual(["a", "b"]);
  });

  it("orders cards by study progress before applying the maximum", () => {
    const unorderedCards = [makeCard("seen", 5), makeCard("new", 1), makeCard("middle", 3)];

    expect(buildStudyCardOrder(unorderedCards, { shuffled: false, maxNumberOfCardsToLearn: 2 })).toEqual([
      "new",
      "middle",
    ]);
  });

  it("shuffles before applying the maximum", () => {
    expect(buildStudyCardOrder(cards, { shuffled: true, maxNumberOfCardsToLearn: 2 })).toEqual(["d", "c"]);
    expect(mocks.shuffle).toHaveBeenCalledWith(["a", "b", "c", "d"]);
  });
});
