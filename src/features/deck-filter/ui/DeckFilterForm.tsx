import type * as React from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/ui/button";

import { ScoreRange } from "./ScoreRange";
import { TagFilter } from "./TagFilter";

interface DeckFilterFormProps {
  scoreMax: number | null;
  scoreMin: number | null;
  selectedTags: string[];
  tagAndFilter: boolean;
  dirty: boolean;
  disabled?: boolean;
  saving: boolean;
  clearScoreRange: () => void;
  save: () => Promise<void>;
  setScoreMax: (value: number | null) => void;
  setScoreMin: (value: number | null) => void;
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
        <ScoreRange
          maximum={props.scoreMax}
          minimum={props.scoreMin}
          onClear={props.clearScoreRange}
          onMaximumChange={props.setScoreMax}
          onMinimumChange={props.setScoreMin}
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
