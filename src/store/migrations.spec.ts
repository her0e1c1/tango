import { describe, expect, it } from "vitest";

import { migratePersistedState } from "@/store/migrations";

describe("persisted Redux state migrations", () => {
  it("runs both v0 migrations without mutating or dropping persisted state", async () => {
    const arrayEntry = ["keep", "this"];
    const legacyDeck = {
      id: "deck-1",
      name: "Legacy deck",
      url: "https://example.com/deck",
      isPublic: true,
      uid: "legacy-user",
      createdAt: 1,
      updatedAt: 2,
      deletedAt: null,
      localMode: true,
      scoreMax: 5,
      scoreMin: -3,
      selectedTags: ["math"],
      tagAndFilter: true,
      category: "school",
      convertToBr: true,
      currentIndex: 1,
      cardOrderIds: ["card-1", "card-2"],
      customMetadata: { source: "import" },
    };
    const currentDeck = {
      id: "deck-2",
      name: "Current deck",
      currentIndex: null,
      cardOrderIds: [],
    };
    const persisted = {
      deck: {
        byId: {
          "deck-1": legacyDeck,
          "deck-2": currentDeck,
          missing: null,
          numeric: 42,
          text: "keep",
          array: arrayEntry,
        },
        categories: ["school"],
        syncMetadata: { cursor: "next" },
      },
      card: { byId: { "card-1": { id: "card-1" } }, tags: ["math"] },
      config: {
        darkMode: true,
        uid: "legacy-user",
        showBackText: true,
        autoPlay: true,
        lastSwipe: "cardSwipeLeft",
      },
      rootMetadata: { lastWrite: 10 },
      _persist: { version: 0, rehydrated: true },
    };
    const original = structuredClone(persisted);

    const result = (await migratePersistedState(persisted, 2)) as typeof persisted;

    expect(result).toEqual({
      ...persisted,
      deck: {
        ...persisted.deck,
        byId: {
          ...persisted.deck.byId,
          "deck-1": {
            id: "deck-1",
            name: "Legacy deck",
            url: "https://example.com/deck",
            isPublic: true,
            uid: "legacy-user",
            createdAt: 1,
            updatedAt: 2,
            deletedAt: null,
            localMode: true,
            scoreMax: 5,
            scoreMin: -3,
            selectedTags: ["math"],
            tagAndFilter: true,
            category: "school",
            convertToBr: true,
            customMetadata: { source: "import" },
          },
          "deck-2": {
            id: "deck-2",
            name: "Current deck",
          },
        },
      },
      config: {
        darkMode: true,
        uid: "legacy-user",
      },
    });
    expect(result).not.toBe(persisted);
    expect(result.deck).not.toBe(persisted.deck);
    expect(result.deck.byId).not.toBe(persisted.deck.byId);
    expect(result.deck.byId["deck-1"]).not.toBe(legacyDeck);
    expect(result.deck.byId["deck-2"]).not.toBe(currentDeck);
    expect(result.deck.byId.array).toBe(arrayEntry);
    expect(persisted).toEqual(original);
  });

  it("runs only the deck cleanup when migrating from v1", async () => {
    const persisted = {
      deck: {
        byId: {
          "deck-1": {
            id: "deck-1",
            currentIndex: 1,
            cardOrderIds: ["card-1"],
          },
        },
        categories: [],
      },
      config: {
        showBackText: true,
        autoPlay: true,
        lastSwipe: "cardSwipeRight",
      },
      _persist: { version: 1, rehydrated: false },
    };

    const result = await migratePersistedState(persisted, 2);

    expect(result).toEqual({
      ...persisted,
      deck: {
        ...persisted.deck,
        byId: {
          "deck-1": { id: "deck-1" },
        },
      },
    });
  });

  it.each([
    ["a missing deck slice", undefined],
    ["a null deck slice", null],
    ["an array deck slice", []],
    ["a missing byId value", { categories: ["keep"] }],
    ["a null byId value", { byId: null, categories: ["keep"] }],
    ["an array byId value", { byId: ["keep"], categories: ["keep"] }],
  ])("preserves persisted state with %s", async (_label, deck) => {
    const persisted = {
      ...(deck !== undefined ? { deck } : {}),
      card: { byId: {}, tags: [] },
      rootMetadata: "keep",
      _persist: { version: 1, rehydrated: false },
    };

    await expect(migratePersistedState(persisted, 2)).resolves.toEqual(persisted);
  });

  it("keeps migration 1 tolerant of missing and malformed config values", async () => {
    const missingConfig = {
      deck: { byId: {}, categories: [] },
      _persist: { version: 0, rehydrated: false },
    };
    const malformedConfig = {
      config: null,
      _persist: { version: 0, rehydrated: false },
    };

    await expect(migratePersistedState(missingConfig, 1)).resolves.toEqual(missingConfig);
    await expect(migratePersistedState(malformedConfig, 1)).resolves.toEqual(malformedConfig);
  });
});
