import { describe, expect, it } from "vitest";

import { createDeck } from "@/test/factories";
import { toDeckDomainFromStore, toDeckView } from "./dto";

describe("Deck DTO mapping", () => {
  it("maps a stored Deck through canonical domain state before exposing its public view", () => {
    const domain = toDeckDomainFromStore(createDeck({ id: "remote", uid: "owner" }));

    expect(domain).toEqual({
      id: "remote",
      ownerId: "owner",
      name: "Deck",
      url: null,
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
    expect(toDeckView(domain, false)).toEqual({
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
