import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAuthUid } from "@/entities/auth";
import { type Deck, editDeck } from "@/entities/deck";
import { type Difficulty, MAX_DIFFICULTY, MIN_DIFFICULTY } from "@/entities/study-progress";
import { showToast } from "@/shared/ui/toast";

export interface DeckFilterState {
  difficultyLowerBound: number;
  difficultyMax: Difficulty | null;
  difficultyMin: Difficulty | null;
  difficultyUpperBound: number;
  selectedTags: string[];
  tagAndFilter: boolean;
  saving: boolean;
  clearDifficultyRange: () => void;
  setDifficultyMax: (value: Difficulty | null) => void;
  setDifficultyMin: (value: Difficulty | null) => void;
  setSelectedTags: (value: string[]) => void;
  setTagAndFilter: (value: boolean) => void;
}

type DeckFilterValues = Pick<Deck, "difficultyMax" | "difficultyMin" | "selectedTags" | "tagAndFilter">;

interface FilterModelState {
  key: string;
  draft: DeckFilterValues;
  pending?: Promise<void> | undefined;
}

// Pending drafts and writes outlive a Page so navigation cannot restore an older filter or reorder saves.
// Keep failed drafts for retry; successful writes return ownership to the Deck repository.
const pendingFilters = new Map<string, FilterModelState>();

const toFilterValues = (deck: Deck): DeckFilterValues => ({
  difficultyMax: deck.difficultyMax,
  difficultyMin: deck.difficultyMin,
  selectedTags: [...deck.selectedTags],
  tagAndFilter: deck.tagAndFilter,
});

const areFiltersEqual = (left: DeckFilterValues, right: DeckFilterValues): boolean =>
  left.difficultyMax === right.difficultyMax &&
  left.difficultyMin === right.difficultyMin &&
  left.tagAndFilter === right.tagAndFilter &&
  left.selectedTags.length === right.selectedTags.length &&
  left.selectedTags.every((tag, index) => tag === right.selectedTags[index]);

export const useDeckFilterState = (deck: Deck): DeckFilterState => {
  const { t } = useTranslation();
  const uid = useAuthUid();
  const key = JSON.stringify([uid, deck.id]);
  const [state, setState] = useState<FilterModelState>(
    () => pendingFilters.get(key) ?? { key, draft: toFilterValues(deck) }
  );

  if (state.key !== key) {
    setState(pendingFilters.get(key) ?? { key, draft: toFilterValues(deck) });
  }

  useEffect(() => {
    let active = true;
    void state.pending?.then(() => {
      if (active) {
        setState((current) => (current.pending === state.pending ? { ...current, pending: undefined } : current));
      }
    });
    return () => {
      active = false;
    };
  }, [state.pending]);

  const updateDraft = (patch: Partial<DeckFilterValues>) => {
    const queued = pendingFilters.get(key);
    const previous = queued?.draft ?? state.draft;
    const submitted = { ...previous, ...patch };
    if (areFiltersEqual(previous, submitted)) return;

    // Submit full selections in order so the next change also retries any failed fields.
    const pending = (queued?.pending ?? Promise.resolve()).then(async () => {
      try {
        await editDeck(uid, { id: deck.id, ...submitted });
        if (pendingFilters.get(key)?.pending === pending) pendingFilters.delete(key);
      } catch {
        if (pendingFilters.get(key)?.pending === pending) pendingFilters.set(key, { key, draft: submitted });
        showToast({ message: t("deckFilter.saveError"), tone: "error" });
      }
    });
    const next = { key, draft: submitted, pending };
    pendingFilters.set(key, next);
    setState(next);
  };

  return {
    difficultyLowerBound: MIN_DIFFICULTY,
    ...state.draft,
    difficultyUpperBound: MAX_DIFFICULTY,
    saving: state.pending !== undefined,
    clearDifficultyRange: () => updateDraft({ difficultyMax: MAX_DIFFICULTY, difficultyMin: MIN_DIFFICULTY }),
    setDifficultyMax: (value) => updateDraft({ difficultyMax: value }),
    setDifficultyMin: (value) => updateDraft({ difficultyMin: value }),
    setSelectedTags: (value) => updateDraft({ selectedTags: value }),
    setTagAndFilter: (value) => updateDraft({ tagAndFilter: value }),
  };
};
