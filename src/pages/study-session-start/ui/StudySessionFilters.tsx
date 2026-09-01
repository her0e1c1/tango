import type * as React from "react";
import { useTranslation } from "react-i18next";

import { ScoreRange } from "@/features/deck-filter";
import { Button } from "@/shared/ui/button";

import { StudySessionTagFilter } from "./StudySessionTagFilter";

interface StudySessionFiltersProps {
  scoreMax: number | null;
  scoreMin: number | null;
  selectedTags: string[];
  tagAndFilter: boolean;
  tags: string[];
  dirty: boolean;
  disabled?: boolean;
  saving: boolean;
  clearScoreRange: () => void;
  save: () => Promise<void>;
  setScoreMax: (value: number | null) => void;
  setScoreMin: (value: number | null) => void;
  setSelectedTags: (value: string[]) => void;
  setTagAndFilter: (value: boolean) => void;
}

export const StudySessionFilters: React.FC<StudySessionFiltersProps> = (props) => {
  const { t } = useTranslation();
  const disabled = props.disabled || props.saving;

  return (
    <div className="w-full space-y-4 text-ink">
      <fieldset className="contents" disabled={disabled}>
        <ScoreRange
          maximum={props.scoreMax}
          minimum={props.scoreMin}
          onClear={props.clearScoreRange}
          onMaximumChange={props.setScoreMax}
          onMinimumChange={props.setScoreMin}
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
