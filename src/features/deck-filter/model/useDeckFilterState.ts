import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAuthUid } from "@/entities/auth";
import { type Deck, editDeck } from "@/entities/deck";
import { type Difficulty, MAX_DIFFICULTY, MIN_DIFFICULTY } from "@/entities/study-progress";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { showToast } from "@/shared/ui/toast";

export interface DeckFilterState {
  difficultyLowerBound: number;
  difficultyMax: Difficulty | null;
  difficultyMin: Difficulty | null;
  difficultyUpperBound: number;
  selectedTags: string[];
  tagAndFilter: boolean;
  dirty: boolean;
  saving: boolean;
  clearDifficultyRange: () => void;
  save: () => Promise<void>;
  setDifficultyMax: (value: Difficulty | null) => void;
  setDifficultyMin: (value: Difficulty | null) => void;
  setSelectedTags: (value: string[]) => void;
  setTagAndFilter: (value: boolean) => void;
}

type DeckFilterValues = Pick<Deck, "difficultyMax" | "difficultyMin" | "selectedTags" | "tagAndFilter">;

interface FilterModelState {
  baseline: DeckFilterValues;
  deckId: Deck["id"];
  draft: DeckFilterValues;
  saving: boolean;
}

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
  const isMounted = useMountedGuard();
  const [state, setState] = useState<FilterModelState>(() => {
    const filter = toFilterValues(deck);
    return { baseline: filter, deckId: deck.id, draft: filter, saving: false };
  });
  const savingRef = useRef(false);

  if (state.deckId !== deck.id) {
    const filter = toFilterValues(deck);
    setState({ baseline: filter, deckId: deck.id, draft: filter, saving: false });
  }

  const updateDraft = (patch: Partial<DeckFilterValues>) => {
    setState((current) => ({ ...current, draft: { ...current.draft, ...patch } }));
  };

  const save = async () => {
    // biome-ignore lint/suspicious/noUnnecessaryConditions: Another same-tick Save can observe this ref before React rerenders.
    if (savingRef.current || areFiltersEqual(state.baseline, state.draft)) return;
    const submitted = { ...state.draft, selectedTags: [...state.draft.selectedTags] };
    savingRef.current = true;
    setState((current) => ({ ...current, saving: true }));
    try {
      await editDeck(uid, { id: deck.id, ...submitted });
      if (!isMounted()) return;
      setState((current) => ({ ...current, baseline: submitted }));
      showToast({ message: t("deckFilter.saveSuccess"), tone: "success" });
    } catch {
      if (isMounted()) showToast({ message: t("deckFilter.saveError"), tone: "error" });
    } finally {
      savingRef.current = false;
      if (isMounted()) setState((current) => ({ ...current, saving: false }));
    }
  };

  return {
    difficultyLowerBound: MIN_DIFFICULTY,
    ...state.draft,
    difficultyUpperBound: MAX_DIFFICULTY,
    dirty: !areFiltersEqual(state.baseline, state.draft),
    saving: state.saving,
    clearDifficultyRange: () => updateDraft({ difficultyMax: MAX_DIFFICULTY, difficultyMin: MIN_DIFFICULTY }),
    save,
    setDifficultyMax: (value) => updateDraft({ difficultyMax: value }),
    setDifficultyMin: (value) => updateDraft({ difficultyMin: value }),
    setSelectedTags: (value) => updateDraft({ selectedTags: value }),
    setTagAndFilter: (value) => updateDraft({ tagAndFilter: value }),
  };
};
