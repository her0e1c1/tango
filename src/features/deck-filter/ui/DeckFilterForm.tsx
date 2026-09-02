import type * as React from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/ui/button";

import { DifficultyRange } from "./DifficultyRange";
import { TagFilter } from "./TagFilter";

interface DeckFilterFormProps {
  difficultyLowerBound: number;
  difficultyMax: number | null;
  difficultyMin: number | null;
  difficultyUpperBound: number;
  selectedTags: string[];
  tagAndFilter: boolean;
  dirty: boolean;
  disabled?: boolean;
  saving: boolean;
  clearDifficultyRange: () => void;
  save: () => Promise<void>;
  setDifficultyMax: (value: number | null) => void;
  setDifficultyMin: (value: number | null) => void;
  setSelectedTags: (value: string[]) => void;
  setTagAndFilter: (value: boolean) => void;
  tags: string[];
}

export const DeckFilterForm: React.FC<DeckFilterFormProps> = (props) => {
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
        <TagFilter
          tags={props.tags}
          selectedTags={props.selectedTags}
          tagAndFilter={props.tagAndFilter}
          onClickFilter={props.setTagAndFilter}
          onClickAll={() => props.setSelectedTags(props.tags)}
          onClickClear={() => props.setSelectedTags([])}
          onClickTag={props.setSelectedTags}
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
