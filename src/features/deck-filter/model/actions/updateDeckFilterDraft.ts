import { editDeck } from "@/entities/deck";
import { showToast } from "@/shared/ui/toast";
import { areFiltersEqual } from "../rules";
import { pendingFilters } from "../store";
import type { DeckFilterValues, UpdateDeckFilterOptions } from "../types";

export const updateDeckFilterDraft = (
  patch: Partial<DeckFilterValues>,
  { uid, deckId, draft, setState, errorMessage }: UpdateDeckFilterOptions
): void => {
  const key = JSON.stringify([uid, deckId]);
  const queued = pendingFilters.get(key);
  const previous = queued?.draft ?? draft;
  const submitted = { ...previous, ...patch };
  if (areFiltersEqual(previous, submitted)) return;

  // Submit complete selections serially so newer changes cannot overtake earlier writes,
  // and changing any field also retries fields retained from a failed save.
  const pending = (queued?.pending ?? Promise.resolve()).then(async () => {
    try {
      await editDeck(uid, { id: deckId, ...submitted });
      if (pendingFilters.get(key)?.pending === pending) pendingFilters.delete(key);
    } catch {
      if (pendingFilters.get(key)?.pending === pending) pendingFilters.set(key, { key, draft: submitted });
      showToast({ message: errorMessage, tone: "error" });
    }
  });
  const next = { key, draft: submitted, pending };
  pendingFilters.set(key, next);
  setState(next);
};
