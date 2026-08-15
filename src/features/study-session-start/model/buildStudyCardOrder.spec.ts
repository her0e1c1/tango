import type { StudyPreferences } from "@/entities/preferences";

import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

const mocks = vi.hoisted(() => ({ shuffle: vi.fn((ids: string[]) => [...ids].reverse()) }));

vi.mock("lodash", () => ({ shuffle: mocks.shuffle }));

import { createCard } from "@/test/factories";
import { buildStudyCardOrder } from "./buildStudyCardOrder";

describe("buildStudyCardOrder", () => {
  const cards = [createCard({ id: "a" }), createCard({ id: "b" }), createCard({ id: "c" }), createCard({ id: "d" })];

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
    const unorderedCards = [
      createCard({ id: "seen", numberOfSeen: 5 }),
      createCard({ id: "new", numberOfSeen: 1 }),
      createCard({ id: "middle", numberOfSeen: 3 }),
    ];

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
