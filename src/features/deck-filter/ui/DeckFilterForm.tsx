import type * as React from "react";

import { TagFilter } from "./TagFilter";

interface DeckFilterFormProps {
  selectedTags: string[];
  tagAndFilter: boolean;
  disabled?: boolean;
  setSelectedTags: (value: string[]) => void;
  setTagAndFilter: (value: boolean) => void;
  tags: string[];
}

export const DeckFilterForm: React.FC<DeckFilterFormProps> = (props) => (
  <div className="w-full space-y-4 text-ink">
    <fieldset className="contents" disabled={props.disabled}>
      <TagFilter
        tags={props.tags}
        selectedTags={props.selectedTags}
        matchAll={props.tagAndFilter}
        onSelectedTagsChange={props.setSelectedTags}
        onMatchAllChange={props.setTagAndFilter}
      />
    </fieldset>
  </div>
);
