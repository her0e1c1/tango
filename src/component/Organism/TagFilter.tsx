import * as React from "react";
import { type Control, useController } from "react-hook-form";
import { Button, Switch, Tag, Description } from "../Atom";
import { TagList } from "../Molecule";

const updateTags = (tags: string[], tag: string) => {
  if (tags.includes(tag)) {
    return tags.filter((t) => t !== tag);
  } else {
    return [...tags, tag];
  }
};

export const TagFilter: React.FC<{
  onClickTag?: (tags: string[]) => void;
  onClickFilter?: (v: boolean) => void;
  onClickAll?: () => void;
  onClickClear?: () => void;
  tagAndFilter?: boolean;
  selectedTags?: string[];
  tags?: string[];
  scroll?: boolean;
}> = (props) => {
  const [tags, setTags] = React.useState(props.selectedTags);
  const onClickTag = props.onClickTag;
  React.useEffect(() => {
    onClickTag?.(tags ?? []);
  }, [tags, onClickTag]);
  const onClickFilter = props.onClickFilter;
  const onChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onClickFilter?.(e.target.checked);
    },
    [onClickFilter]
  );
  return (
    <div data-testid="tag-filter">
      <div className="flex justify-between items-center">
        <Description>{props.tagAndFilter ? "AND" : "OR"} Filter</Description>
        <div className="flex justify-end mb-3 gap-3 items-center">
          <Switch name="tag-filter-click-filter" checked={props.tagAndFilter} onChange={onChange} />
          <Button small primary label="All" onClick={props.onClickAll} />
          <Button small default label="Clear" onClick={props.onClickClear} />
        </div>
      </div>
      <TagList hasManyItems={(props.tags?.length ?? 0) > 30}>
        {props.tags?.map((tag) => (
          <Tag
            className="mr-1 mb-1"
            primary
            small
            key={tag}
            label={tag}
            checked={props.selectedTags?.includes(tag)}
            onChange={() => {
              setTags(updateTags(props.selectedTags ?? [], tag));
            }}
          />
        ))}
      </TagList>
    </div>
  );
};

export const ControlTagFilter: React.FC<{ control: Control<Deck>; tags: string[] }> = (props) => {
  const {
    field: { value: selectedTags, onChange: setSelectedTags },
  } = useController({ control: props.control, name: "selectedTags" });
  const {
    field: { value: tagAndFilter, onChange: setTagAndFilter },
  } = useController({ control: props.control, name: "tagAndFilter" });
  const onClickFilter = React.useCallback(
    (v: boolean) => {
      setTagAndFilter(v);
    },
    [setTagAndFilter]
  );
  const onClickAll = React.useCallback(() => {
    setSelectedTags(props.tags);
  }, [setSelectedTags, props.tags]);
  const onClickClear = React.useCallback(() => {
    setSelectedTags([]);
  }, [setSelectedTags]);
  const onClickTag = React.useCallback(
    (tags: string[]) => {
      setSelectedTags(tags);
    },
    [setSelectedTags]
  );
  return (
    <TagFilter
      tags={props.tags}
      selectedTags={selectedTags}
      tagAndFilter={tagAndFilter}
      onClickFilter={onClickFilter}
      onClickAll={onClickAll}
      onClickClear={onClickClear}
      onClickTag={onClickTag}
    />
  );
};
