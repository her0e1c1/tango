import type * as React from "react";

import { ScoreRange } from "./ScoreRange";
import { TagFilter } from "./TagFilter";

interface DeckFilterFormProps {
  scoreMax: number | null;
  scoreMin: number | null;
  selectedTags: string[];
  tagAndFilter: boolean;
  setScoreMax: (value: number | null) => void;
  setScoreMin: (value: number | null) => void;
  setSelectedTags: (value: string[]) => void;
  setTagAndFilter: (value: boolean) => void;
  tags: string[];
}

export const DeckFilterForm: React.FC<DeckFilterFormProps> = (props) => (
  <div className="w-full space-y-4 text-ink">
    <ScoreRange
      maximum={props.scoreMax}
      minimum={props.scoreMin}
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
  </div>
);
