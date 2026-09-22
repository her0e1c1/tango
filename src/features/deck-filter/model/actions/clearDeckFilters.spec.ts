import { describe, expect, it, vi } from "vitest";

import { MAX_DIFFICULTY, MIN_DIFFICULTY } from "@/entities/study-progress";
import type { DeckFilterValues, UpdateDeckFilterOptions } from "../types";
import { clearDeckFilters } from "./clearDeckFilters";
import { updateDeckFilterDraft } from "./updateDeckFilterDraft";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("./updateDeckFilterDraft", () => ({
  updateDeckFilterDraft: vi.fn(),
}));

describe("clearDeckFilters [CARD-LIST-ACTIONS-03]", () => {
  it("resets difficulty range boundaries and clears selected tags", () => {
    const draft: DeckFilterValues = {
      difficultyMax: 8,
      difficultyMin: 3,
      selectedTags: ["tag1", "tag2"],
      tagAndFilter: true,
    };
    const setState = vi.fn();
    const options: UpdateDeckFilterOptions = {
      uid: "user-1",
      deckId: "deck-1",
      draft,
      setState,
    };

    clearDeckFilters(options);

    expect(updateDeckFilterDraft).toHaveBeenCalledWith(
      {
        difficultyMax: MAX_DIFFICULTY,
        difficultyMin: MIN_DIFFICULTY,
        selectedTags: [],
      },
      options
    );
  });
});
