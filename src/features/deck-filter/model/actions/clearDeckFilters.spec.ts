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

    clearDeckFilters(options);

    expect(updateDeckFilterDraft).toHaveBeenCalledWith(
      {
        selectedTags: [],
      },
      options
    );
  });
});
