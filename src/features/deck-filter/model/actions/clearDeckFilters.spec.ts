import { describe, expect, it, vi } from "vitest";

import type { DeckFilterValues, UpdateDeckFilterOptions } from "../types";
import { clearDeckFilters } from "./clearDeckFilters";
import { updateDeckFilterDraft } from "./updateDeckFilterDraft";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("./updateDeckFilterDraft", () => ({
  updateDeckFilterDraft: vi.fn(),
}));

describe("clearDeckFilters [CARD-LIST-ACTIONS-01]", () => {
  it("clears selected tags", () => {
    // Given: Prepare `draft`, `setState`, `options` and any shared test state below.
    const draft: DeckFilterValues = {
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

    // When: Exercise `clearDeckFilters` with the prepared inputs.
    clearDeckFilters(options);

    // Then: Verify the expected result in the assertions below.
    expect(updateDeckFilterDraft).toHaveBeenCalledWith(
      {
        selectedTags: [],
      },
      options
    );
  });
});
