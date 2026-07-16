import type * as React from "react";
import { Button, Description, Section, Switch, Tag, TagList } from "@/shared/components";

const updateTags = (tags: string[], tag: string) => {
  if (tags.includes(tag)) {
    return tags.filter((t) => t !== tag);
  } else {
    return [...tags, tag];
  }
};

export interface TagFilterProps {
  onClickTag?: (tags: string[]) => void;
  onClickFilter?: (v: boolean) => void;
  onClickAll?: () => void;
  onClickClear?: () => void;
  tagAndFilter?: boolean;
  selectedTags?: string[];
  tags?: string[];
  scroll?: boolean;
}

export const TagFilter: React.FC<TagFilterProps> = (props) => {
  return (
    <div
      data-testid="tag-filter"
      className="min-w-0 rounded-surface border border-border bg-surface p-4 shadow-surface"
    >
      <Section title="tags" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Description>{props.tagAndFilter ? "AND" : "OR"} Filter</Description>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Switch
            name="tag-filter-click-filter"
            {...(props.tagAndFilter !== undefined ? { checked: props.tagAndFilter } : {})}
            onChange={(event) => props.onClickFilter?.(event.target.checked)}
          />
          <Button
            small
            primary
            label="All"
            {...(props.onClickAll !== undefined ? { onClick: props.onClickAll } : {})}
          />
          <Button
            small
            default
            label="Clear"
            {...(props.onClickClear !== undefined ? { onClick: props.onClickClear } : {})}
          />
        </div>
      </div>
      <TagList hasManyItems={(props.tags?.length ?? 0) > 30}>
        {props.tags?.map((tag) => (
          <Tag
            className="mr-1 mb-1"
            small
            key={tag}
            label={tag}
            {...(props.selectedTags !== undefined ? { checked: props.selectedTags.includes(tag) } : {})}
            onChange={() => {
              props.onClickTag?.(updateTags(props.selectedTags ?? [], tag));
            }}
          />
        ))}
      </TagList>
    </div>
  );
};
