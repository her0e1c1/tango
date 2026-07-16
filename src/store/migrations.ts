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
  3: (state) => {
    if (state == null) return state;
    const root = state as typeof state & { deck?: unknown; card?: unknown; config?: unknown };
    const result = { ...root };
    const localDeckIds = new Set<string>();

    if (isRecord(root.deck) && isRecord(root.deck.byId)) {
      const byId = Object.fromEntries(
        Object.entries(root.deck.byId).filter(([id, deck]) => {
          const local = isRecord(deck) && deck.localMode === true;
          if (local) localDeckIds.add(id);
          return local;
        })
      );
      const categories = [
        ...new Set(
          Object.values(byId).flatMap((deck) =>
            isRecord(deck) && typeof deck.category === "string" && deck.category !== "" ? [deck.category] : []
          )
        ),
      ];
      result.deck = { ...root.deck, byId, categories };
    }

    if (isRecord(root.card) && isRecord(root.card.byId)) {
      const byId = Object.fromEntries(
        Object.entries(root.card.byId).filter(
          ([, card]) => isRecord(card) && typeof card.deckId === "string" && localDeckIds.has(card.deckId)
        )
      );
      const tags = [
        ...new Set(
          Object.values(byId).flatMap((card) =>
            isRecord(card) && Array.isArray(card.tags)
              ? card.tags.filter((tag): tag is string => typeof tag === "string")
              : []
          )
        ),
      ];
      result.card = { ...root.card, byId, tags };
    }

    if (isRecord(root.config)) {
      const config = { ...root.config };
      delete config.uid;
      delete config.isAnonymous;
      delete config.displayName;
      delete config.lastUpdatedAt;
      result.config = config;
    }

    return result;
  },
});
