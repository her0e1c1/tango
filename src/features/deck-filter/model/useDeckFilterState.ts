import { useRef, useState } from "react";

import { useAuthUid } from "@/entities/auth";
import { type Deck, editDeck } from "@/entities/deck";

export interface DeckFilterState {
  scoreMax: number | null;
  scoreMin: number | null;
  selectedTags: string[];
  tagAndFilter: boolean;
  clearScoreRange: () => void;
  setScoreMax: (value: number | null) => void;
  setScoreMin: (value: number | null) => void;
  setSelectedTags: (value: string[]) => void;
  setTagAndFilter: (value: boolean) => void;
}

type DeckFilterValues = Pick<Deck, "scoreMax" | "scoreMin" | "selectedTags" | "tagAndFilter">;
type DeckFilterKey = keyof DeckFilterValues;
type DeckFilterValue = DeckFilterValues[DeckFilterKey];
type DeckFilterPatch = Partial<DeckFilterValues>;

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
  const changedRevisions = new Set<number>();

  for (const key of FILTER_KEYS) {
    const update = updates[key];
    if (update !== undefined && !areFilterValuesEqual(previousFilter[key], storedFilter[key])) {
      changedRevisions.add(update.revision);
    }
  }

  let nextUpdates = updates;

  for (const key of FILTER_KEYS) {
    const update = nextUpdates[key];
    // All fields written by one action must observe the same subscription confirmation or supersession.
    if (update !== undefined && changedRevisions.has(update.revision)) {
      nextUpdates = update.writeSucceeded
        ? removeOptimisticUpdate(nextUpdates, key)
        : { ...nextUpdates, [key]: { ...update, sourceChanged: true } };
    }
  }

  return nextUpdates;
};

const settleOptimisticUpdate = (
  updates: FilterModelState["optimisticUpdates"],
  key: DeckFilterKey,
  removeTransaction: boolean
): FilterModelState["optimisticUpdates"] => {
  const update = updates[key];
  if (update === undefined) return updates;
  if (removeTransaction) return removeOptimisticUpdate(updates, key);
  return { ...updates, [key]: { ...update, writeSucceeded: true } };
};

const settleOptimisticTransaction = (
  updates: FilterModelState["optimisticUpdates"],
  revision: number,
  succeeded: boolean
): FilterModelState["optimisticUpdates"] => {
  // A later field revision leaves this transaction before an older response can settle it.
  const activeKeys = FILTER_KEYS.filter((key) => updates[key]?.revision === revision);
  const removeTransaction = !succeeded || activeKeys.some((key) => updates[key]?.sourceChanged === true);
  return activeKeys.reduce(
    (currentUpdates, key) => settleOptimisticUpdate(currentUpdates, key, removeTransaction),
    updates
  );
};

export const useDeckFilterState = (deck: Deck): DeckFilterState => {
  const uid = useAuthUid();
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
    // A stored change settles its whole user action while unrelated revisions remain optimistic.
    setFilterState((current) => ({
      ...current,
      optimisticUpdates: reconcileStoredFilter(current.optimisticUpdates, current.storedFilter, storedFilter),
      storedFilter,
    }));
  }

  const settleTransaction = (revision: number, succeeded: boolean) => {
    setFilterState((current) => {
      const optimisticUpdates = settleOptimisticTransaction(current.optimisticUpdates, revision, succeeded);
      return optimisticUpdates === current.optimisticUpdates ? current : { ...current, optimisticUpdates };
    });
  };

  const updateFilter = (patch: DeckFilterPatch) => {
    const keys = FILTER_KEYS.filter((key) => patch[key] !== undefined);
    if (keys.length === 0) return;
    const revision = nextRevision.current + 1;
    nextRevision.current = revision;
    setFilterState((current) => {
      const optimisticUpdates = { ...current.optimisticUpdates };
      // Every field in one user action shares a revision so it is persisted and settled as one patch.
      for (const key of keys) {
        optimisticUpdates[key] = {
          revision,
          sourceChanged: false,
          value: patch[key] as DeckFilterValue,
          writeSucceeded: false,
        };
      }
      return { ...current, optimisticUpdates };
    });
    void editDeck(uid, { id: deck.id, ...patch }).then(
      () => settleTransaction(revision, true),
      () => settleTransaction(revision, false)
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
    clearScoreRange: () => updateFilter({ scoreMax: null, scoreMin: null }),
    setScoreMax: (value) => updateFilter({ scoreMax: value }),
    setScoreMin: (value) => updateFilter({ scoreMin: value }),
    setSelectedTags: (value) => updateFilter({ selectedTags: value }),
    setTagAndFilter: (value) => updateFilter({ tagAndFilter: value }),
  };
};
