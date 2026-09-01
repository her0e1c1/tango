import { useEffect, useId, useRef, useState } from "react";
import type * as React from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/ui/button";
import { TagList } from "@/shared/ui/content";
import { Tag } from "@/shared/ui/forms";

const COLLAPSED_UNSELECTED_TAG_LIMIT = 8;

const uniqueInOrder = (values: readonly string[]): string[] => [...new Set(values)];

export interface StudySessionTagFilterProps {
  tags: string[];
  selectedTags: string[];
  matchAll: boolean;
  onSelectedTagsChange: (tags: string[]) => void;
  onMatchAllChange: (matchAll: boolean) => void;
}

export const StudySessionTagFilter: React.FC<StudySessionTagFilterProps> = (props) => {
  const { t } = useTranslation();
  const idPrefix = useId();
  const [expanded, setExpanded] = useState(false);
  const matchAnyRef = useRef<HTMLInputElement>(null);
  const tagRefs = useRef(new Map<string, HTMLInputElement>());
  const pendingExpandedTagFocusRef = useRef<string | null>(null);
  const headingId = `${idPrefix}-study-session-tags-heading`;
  const tagListId = `${idPrefix}-study-session-tags-list`;
  const tagInputName = `${idPrefix}-study-session-tags`;
  const radioGroupName = `${idPrefix}-study-session-tag-match`;
  const selectedTags = uniqueInOrder(props.selectedTags);
  const selectedTagSet = new Set(selectedTags);
  const unselectedTags = uniqueInOrder(props.tags).filter((tag) => !selectedTagSet.has(tag));
  const hiddenTagCount = Math.max(0, unselectedTags.length - COLLAPSED_UNSELECTED_TAG_LIMIT);
  const visibleUnselectedTags = expanded ? unselectedTags : unselectedTags.slice(0, COLLAPSED_UNSELECTED_TAG_LIMIT);
  // Persisted selections remain visible even when a tag disappeared from the current Card set, so
  // the user can still understand and remove that filter.
  const visibleTags = [...selectedTags, ...visibleUnselectedTags];
  const status =
    selectedTags.length === 0
      ? t("studyStart.tags.noFilter")
      : t("studyStart.tags.selected", { count: selectedTags.length });

  useEffect(() => {
    if (!expanded || pendingExpandedTagFocusRef.current === null) return;

    tagRefs.current.get(pendingExpandedTagFocusRef.current)?.focus();
    pendingExpandedTagFocusRef.current = null;
  }, [expanded]);

  const toggleTag = (tag: string) => {
    if (!selectedTagSet.has(tag)) {
      props.onSelectedTagsChange([...selectedTags, tag]);
      return;
    }

    const nextSelectedTags = selectedTags.filter((selectedTag) => selectedTag !== tag);
    const nextSelectedTagSet = new Set(nextSelectedTags);
    const nextUnselectedTags = uniqueInOrder(props.tags).filter(
      (availableTag) => !nextSelectedTagSet.has(availableTag)
    );
    const nextVisibleTags = expanded
      ? [...nextSelectedTags, ...nextUnselectedTags]
      : [...nextSelectedTags, ...nextUnselectedTags.slice(0, COLLAPSED_UNSELECTED_TAG_LIMIT)];

    if (!nextVisibleTags.includes(tag)) {
      // A controlled update can remove the activated chip from the collapsed list. Move focus
      // first so keyboard users land on a predictable control instead of the document body.
      const nextFocusableTag = nextVisibleTags.find((visibleTag) => tagRefs.current.has(visibleTag));
      (nextFocusableTag === undefined ? matchAnyRef.current : tagRefs.current.get(nextFocusableTag))?.focus();
    }

    props.onSelectedTagsChange(nextSelectedTags);
  };

  return (
    <section
      aria-labelledby={headingId}
      className="min-w-0 space-y-4 rounded-surface border border-border bg-surface p-4 shadow-surface md:p-5"
    >
      <header className="flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 id={headingId} className="text-title font-semibold text-ink">
            {t("studyStart.tags.title")}
          </h2>
          <p aria-live="polite" className="text-caption text-ink-muted">
            {status}
          </p>
        </div>
        <Button
          variant="quiet"
          size="sm"
          className="shrink-0 border-0 text-accent-primary"
          disabled={selectedTags.length === 0}
          onClick={() => {
            // Clearing disables this button, so focus a control that remains operable first.
            matchAnyRef.current?.focus();
            props.onSelectedTagsChange([]);
          }}
        >
          {t("studyStart.tags.clear")}
        </Button>
      </header>

      <fieldset>
        <legend className="text-caption font-semibold text-ink">{t("studyStart.tags.match")}</legend>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
          <label className="flex min-h-touch cursor-pointer items-center gap-2 text-body text-ink">
            <input
              ref={matchAnyRef}
              type="radio"
              name={radioGroupName}
              value="any"
              checked={!props.matchAll}
              className="size-4 accent-accent-primary"
              onChange={() => props.onMatchAllChange(false)}
            />
            {t("studyStart.tags.any")}
          </label>
          <label className="flex min-h-touch cursor-pointer items-center gap-2 text-body text-ink">
            <input
              type="radio"
              name={radioGroupName}
              value="all"
              checked={props.matchAll}
              className="size-4 accent-accent-primary"
              onChange={() => props.onMatchAllChange(true)}
            />
            {t("studyStart.tags.all")}
          </label>
        </div>
      </fieldset>

      <fieldset
        id={tagListId}
        aria-label={t("studyStart.tags.choicesAria")}
        className={visibleTags.length > 30 ? "max-h-64 overflow-y-auto" : undefined}
      >
        {visibleTags.length === 0 ? (
          <p className="text-caption text-ink-muted">{t("studyStart.tags.empty")}</p>
        ) : (
          <TagList>
            {visibleTags.map((tag) => (
              <Tag
                key={tag}
                ref={(element) => {
                  if (element === null) tagRefs.current.delete(tag);
                  else tagRefs.current.set(tag, element);
                }}
                small
                wrap
                label={tag}
                name={tagInputName}
                value={tag}
                checked={selectedTagSet.has(tag)}
                onChange={() => toggleTag(tag)}
              />
            ))}
          </TagList>
        )}
      </fieldset>

      {hiddenTagCount > 0 ? (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={tagListId}
          className="min-h-touch rounded-control px-1 text-caption font-semibold text-accent-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          onClick={(event) => {
            if (!expanded && event.detail === 0) {
              // Keyboard activation inserts the revealed tags before this button. Move focus to
              // the first new tag so forward Tab reaches the newly available choices.
              pendingExpandedTagFocusRef.current = unselectedTags[COLLAPSED_UNSELECTED_TAG_LIMIT] ?? null;
            }
            setExpanded((current) => !current);
          }}
        >
          {expanded ? t("studyStart.tags.showFewer") : t("studyStart.tags.showMore", { count: hiddenTagCount })}
        </button>
      ) : null}
    </section>
  );
};
