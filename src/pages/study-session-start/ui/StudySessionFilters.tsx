import type * as React from "react";

import { ScoreRange } from "@/features/deck-filter";

import { StudySessionTagFilter } from "./StudySessionTagFilter";

interface StudySessionFiltersProps {
  scoreMax: number | null;
  scoreMin: number | null;
  selectedTags: string[];
  tagAndFilter: boolean;
  tags: string[];
  clearScoreRange: () => void;
  setScoreMax: (value: number | null) => void;
  setScoreMin: (value: number | null) => void;
  setSelectedTags: (value: string[]) => void;
  setTagAndFilter: (value: boolean) => void;
}

export const StudySessionFilters: React.FC<StudySessionFiltersProps> = (props) => (
  <div className="w-full space-y-4 text-ink">
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
  </div>
);
