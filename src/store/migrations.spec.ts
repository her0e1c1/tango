import { describe, expect, it } from "vitest";

import { migratePersistedState } from "@src/store/migrations";

const migrate = async <T extends { _persist: { version: number; rehydrated: boolean } }>(state: T) =>
  (await migratePersistedState(state, 1)) as unknown as T;

describe("persisted Redux state migrations", () => {
  it("removes transient study UI while preserving legacy deck progress", async () => {
    const persisted = {
      deck: {
        byId: {
          "deck-1": {
            id: "deck-1",
            currentIndex: 1,
            cardOrderIds: ["card-1", "card-2"],
          },
        },
        categories: [],
      },
      card: { byId: {}, tags: [] },
      config: {
        darkMode: true,
        uid: "legacy-user",
        showBackText: true,
        autoPlay: true,
        lastSwipe: "cardSwipeLeft",
      },
      _persist: { version: 0, rehydrated: true },
    };

    const result = await migrate(persisted);

    expect(result.deck).toEqual(persisted.deck);
    expect(result.config).toEqual({
      darkMode: true,
      uid: "legacy-user",
    });
  });

  it("tolerates persisted state without a config slice", async () => {
    const persisted = {
      deck: { byId: {}, categories: [] },
      _persist: { version: 0, rehydrated: false },
    };

    await expect(migrate(persisted)).resolves.toEqual(persisted);
  });

  it("tolerates an old malformed config value", async () => {
    const persisted = {
      config: null,
      _persist: { version: 0, rehydrated: false },
    };

    await expect(migrate(persisted)).resolves.toEqual(persisted);
  });
});
