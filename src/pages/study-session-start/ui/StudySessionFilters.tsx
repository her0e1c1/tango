import type * as React from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/ui/button";
import { DifficultyRange } from "@/features/deck-filter";

import { StudySessionTagFilter } from "./StudySessionTagFilter";

interface StudySessionFiltersProps {
  difficultyLowerBound: number;
  difficultyMax: number | null;
  difficultyMin: number | null;
  difficultyUpperBound: number;
  selectedTags: string[];
  tagAndFilter: boolean;
  tags: string[];
  dirty: boolean;
  disabled?: boolean;
  saving: boolean;
  clearDifficultyRange: () => void;
  save: () => Promise<void>;
  setDifficultyMax: (value: number | null) => void;
  setDifficultyMin: (value: number | null) => void;
  setSelectedTags: (value: string[]) => void;
  setTagAndFilter: (value: boolean) => void;
}

export const StudySessionFilters: React.FC<StudySessionFiltersProps> = (props) => {
  const { t } = useTranslation();
  const disabled = props.disabled || props.saving;

  return (
    <div className="w-full space-y-4 text-ink">
      <fieldset className="contents" disabled={disabled}>
        <DifficultyRange
          lowerBound={props.difficultyLowerBound}
          maximum={props.difficultyMax}
          minimum={props.difficultyMin}
          onClear={props.clearDifficultyRange}
          onMaximumChange={props.setDifficultyMax}
          onMinimumChange={props.setDifficultyMin}
          upperBound={props.difficultyUpperBound}
        />
        <StudySessionTagFilter
          tags={props.tags}
          selectedTags={props.selectedTags}
          matchAll={props.tagAndFilter}
          onSelectedTagsChange={props.setSelectedTags}
          onMatchAllChange={props.setTagAndFilter}
        />
      </fieldset>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="primary"
          disabled={props.disabled || !props.dirty}
          loading={props.saving}
          onClick={() => void props.save()}
        >
          {t("deckFilter.save")}
        </Button>
      </div>
    </div>
  );
};
