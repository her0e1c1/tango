import type { DeckFilterDraft } from "./types";

// Pending drafts and writes outlive a Page so navigation cannot restore an older filter or reorder saves.
// Failed drafts remain available for retry; successful writes return ownership to the Deck repository.
export const pendingFilters = new Map<string, DeckFilterDraft>();
