import { useRef, useState } from "react";

import { type Deck, editDeck } from "@/entities/deck";
import { useCurrentUser } from "@/entities/user";

export interface DeckFilterState {
  scoreMax: number | null;
  scoreMin: number | null;
  selectedTags: string[];
  tagAndFilter: boolean;
  setScoreMax: (value: number | null) => void;
  setScoreMin: (value: number | null) => void;
  setSelectedTags: (value: string[]) => void;
  setTagAndFilter: (value: boolean) => void;
}

type DeckFilterValues = Pick<Deck, "scoreMax" | "scoreMin" | "selectedTags" | "tagAndFilter">;
type DeckFilterKey = keyof DeckFilterValues;
type DeckFilterValue = DeckFilterValues[DeckFilterKey];

interface OptimisticUpdate {
  revision: number;
  sourceChanged: boolean;
  value: DeckFilterValue;
  writeSucceeded: boolean;
}

interface FilterModelState {
  deckId: Deck["id"];
  optimisticUpdates: Partial<Record<DeckFilterKey, OptimisticUpdate>>;
  storedFilter: DeckFilterValues;
}

const FILTER_KEYS = ["scoreMax", "scoreMin", "selectedTags", "tagAndFilter"] as const;

const toFilterValues = (deck: Deck): DeckFilterValues => ({
  scoreMax: deck.scoreMax,
  scoreMin: deck.scoreMin,
  selectedTags: deck.selectedTags,
  tagAndFilter: deck.tagAndFilter,
});

const areFilterValuesEqual = (left: DeckFilterValue, right: DeckFilterValue): boolean => {
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((value, index) => value === right[index])
    );
  }
  return left === right;
};

const areStoredFiltersEqual = (left: DeckFilterValues, right: DeckFilterValues): boolean =>
  FILTER_KEYS.every((key) => areFilterValuesEqual(left[key], right[key]));

const removeOptimisticUpdate = (
  updates: FilterModelState["optimisticUpdates"],
  key: DeckFilterKey
): FilterModelState["optimisticUpdates"] => {
  const nextUpdates = { ...updates };
  delete nextUpdates[key];
  return nextUpdates;
};

const reconcileStoredFilter = (
  updates: FilterModelState["optimisticUpdates"],
  previousFilter: DeckFilterValues,
  storedFilter: DeckFilterValues
): FilterModelState["optimisticUpdates"] => {
  let nextUpdates = updates;

  for (const key of FILTER_KEYS) {
    const update = nextUpdates[key];
    if (update !== undefined && !areFilterValuesEqual(previousFilter[key], storedFilter[key])) {
      nextUpdates = update.writeSucceeded
        ? removeOptimisticUpdate(nextUpdates, key)
        : { ...nextUpdates, [key]: { ...update, sourceChanged: true } };
    }
  }

  return nextUpdates;
};

export const useDeckFilterState = (deck: Deck): DeckFilterState => {
  const uid = useCurrentUser()?.uid ?? "";
  const storedFilter = toFilterValues(deck);
  const [filterState, setFilterState] = useState<FilterModelState>(() => ({
    deckId: deck.id,
    optimisticUpdates: {},
    storedFilter,
  }));
  const nextRevision = useRef(0);

  if (filterState.deckId !== deck.id) {
    setFilterState({ deckId: deck.id, optimisticUpdates: {}, storedFilter });
  } else if (!areStoredFiltersEqual(filterState.storedFilter, storedFilter)) {
    // Only the changed field confirms or supersedes its optimistic write; unrelated Entity updates must keep it intact.
    setFilterState((current) => ({
      ...current,
      optimisticUpdates: reconcileStoredFilter(current.optimisticUpdates, current.storedFilter, storedFilter),
      storedFilter,
    }));
  }

  const settleUpdate = (key: DeckFilterKey, revision: number, succeeded: boolean) => {
    setFilterState((current) => {
      const update = current.optimisticUpdates[key];
      // A slower response from an older write must not replace the user's newer choice.
      if (update?.revision !== revision) return current;
      if (!succeeded || update.sourceChanged) {
        return { ...current, optimisticUpdates: removeOptimisticUpdate(current.optimisticUpdates, key) };
      }
      return {
        ...current,
        optimisticUpdates: {
          ...current.optimisticUpdates,
          [key]: { ...update, writeSucceeded: true },
        },
      };
    });
  };

  const updateFilter = <Key extends DeckFilterKey>(key: Key, value: DeckFilterValues[Key]) => {
    const revision = nextRevision.current + 1;
    nextRevision.current = revision;
    setFilterState((current) => ({
      ...current,
      optimisticUpdates: {
        ...current.optimisticUpdates,
        [key]: { revision, sourceChanged: false, value, writeSucceeded: false },
      },
    }));
    void editDeck(uid, { id: deck.id, [key]: value }).then(
      () => settleUpdate(key, revision, true),
      () => settleUpdate(key, revision, false)
    );
  };

  const getFilterValue = <Key extends DeckFilterKey>(key: Key): DeckFilterValues[Key] => {
    const update = filterState.optimisticUpdates[key];
    return (update === undefined ? storedFilter[key] : update.value) as DeckFilterValues[Key];
  };

  return {
    scoreMax: getFilterValue("scoreMax"),
    scoreMin: getFilterValue("scoreMin"),
    selectedTags: getFilterValue("selectedTags"),
    tagAndFilter: getFilterValue("tagAndFilter"),
    setScoreMax: (value) => updateFilter("scoreMax", value),
    setScoreMin: (value) => updateFilter("scoreMin", value),
    setSelectedTags: (value) => updateFilter("selectedTags", value),
    setTagAndFilter: (value) => updateFilter("tagAndFilter", value),
  };
};
