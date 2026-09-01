import type * as React from "react";

import { DifficultyRange } from "./DifficultyRange";
import { TagFilter } from "./TagFilter";

interface DeckFilterFormProps {
  difficultyLowerBound: number;
  difficultyMax: number | null;
  difficultyMin: number | null;
  difficultyUpperBound: number;
  selectedTags: string[];
  tagAndFilter: boolean;
  clearDifficultyRange: () => void;
  setDifficultyMax: (value: number | null) => void;
  setDifficultyMin: (value: number | null) => void;
  setSelectedTags: (value: string[]) => void;
  setTagAndFilter: (value: boolean) => void;
  tags: string[];
}

export const DeckFilterForm: React.FC<DeckFilterFormProps> = (props) => (
  <div className="w-full space-y-4 text-ink">
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
  </div>
);
