import { createMigrate } from "redux-persist";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value != null && !Array.isArray(value);

export const migratePersistedState = createMigrate({
  1: (state) => {
    if (state == null) return state;

    const root = state as typeof state & { config?: unknown };
    if (!isRecord(root.config)) return state;

    const config = { ...root.config };
    delete config.showBackText;
    delete config.autoPlay;
    delete config.lastSwipe;

    return { ...root, config };
  },
  2: (state) => {
    if (state == null) return state;

    const root = state as typeof state & { deck?: unknown };
    if (!isRecord(root.deck) || !isRecord(root.deck.byId)) return state;

    const byId = Object.fromEntries(
      Object.entries(root.deck.byId).map(([id, entry]) => {
        if (!isRecord(entry)) return [id, entry];

        const migratedEntry = { ...entry };
        delete migratedEntry.currentIndex;
        delete migratedEntry.cardOrderIds;
        return [id, migratedEntry];
      })
    );

    return {
      ...root,
      deck: {
        ...root.deck,
        byId,
      },
    };
  },
});
