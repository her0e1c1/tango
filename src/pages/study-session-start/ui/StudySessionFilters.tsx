import type * as React from "react";

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
  clearDifficultyRange: () => void;
  setDifficultyMax: (value: number | null) => void;
  setDifficultyMin: (value: number | null) => void;
  setSelectedTags: (value: string[]) => void;
  setTagAndFilter: (value: boolean) => void;
}

export const StudySessionFilters: React.FC<StudySessionFiltersProps> = (props) => (
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
    <StudySessionTagFilter
      tags={props.tags}
      selectedTags={props.selectedTags}
      matchAll={props.tagAndFilter}
      onSelectedTagsChange={props.setSelectedTags}
      onMatchAllChange={props.setTagAndFilter}
    />
  </div>
);
