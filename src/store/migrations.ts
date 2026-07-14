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
});
