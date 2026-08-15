import { describe, expect, it } from "vitest";

import { createDeck } from "@/test/factories";
import { toDeckView } from "./dto";

describe("Deck DTO mapping", () => {
  it("maps a stored Deck to the public view without persistence metadata", () => {
    const storedDeck = createDeck({ id: "remote", uid: "owner" });

    expect(toDeckView(storedDeck)).toEqual({
      id: "remote",
      localMode: false,
      name: "Deck",
      isPublic: false,
      createdAt: 0,
      updatedAt: 0,
      scoreMax: null,
      scoreMin: null,
      selectedTags: [],
      tagAndFilter: false,
      category: "",
      convertToBr: false,
    });
  });
});
