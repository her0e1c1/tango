import type { Card } from "@/entities/card";
import type { StudyPreferences } from "@/entities/preferences";

import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ shuffle: vi.fn((ids: string[]) => [...ids].reverse()) }));

vi.mock("lodash", () => ({ shuffle: mocks.shuffle }));

import { buildStudySession } from "./buildStudySession";

describe("buildStudySession", () => {
  const cards = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }] as Card[];

  it("returns a copied card order when shuffle and maximum are disabled", () => {
    const study = { shuffled: false, maxNumberOfCardsToLearn: 0 } as StudyPreferences;
    const result = buildStudySession(cards, study);
    expect(result).toEqual(["a", "b", "c", "d"]);
    expect(result).not.toBe(cards);
  });

  it("returns no card IDs for an empty selection", () => {
    expect(buildStudySession([], { shuffled: false, maxNumberOfCardsToLearn: 0 })).toEqual([]);
  });

  it("limits the number of cards", () => {
    expect(buildStudySession(cards, { shuffled: false, maxNumberOfCardsToLearn: 2 })).toEqual(["a", "b"]);
  });

  it("shuffles before applying the maximum", () => {
    expect(buildStudySession(cards, { shuffled: true, maxNumberOfCardsToLearn: 2 })).toEqual(["d", "c"]);
    expect(mocks.shuffle).toHaveBeenCalledWith(["a", "b", "c", "d"]);
  });
});
