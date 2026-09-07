import { useEffect, useId, useRef, useState } from "react";
import type * as React from "react";
import { useTranslation } from "react-i18next";
import { AiOutlineCheck, AiOutlineDown, AiOutlineUp } from "react-icons/ai";

const COLLAPSED_UNSELECTED_TAG_LIMIT = 8;

const uniqueInOrder = (values: readonly string[]): string[] => [...new Set(values)];

export interface TagFilterProps {
  tags: string[];
  selectedTags: string[];
  matchAll: boolean;
  onSelectedTagsChange: (tags: string[]) => void;
  onMatchAllChange: (matchAll: boolean) => void;
}

interface TagFilterChoiceProps {
  tag: string;
  checked: boolean;
  name: string;
  onChange: () => void;
  ref: React.Ref<HTMLInputElement>;
}

const TagFilterChoice: React.FC<TagFilterChoiceProps> = ({ tag, checked, name, onChange, ref }) => (
  <label className="relative inline-flex min-w-0 max-w-full">
    <input
      ref={ref}
      type="checkbox"
      className="peer sr-only"
      name={name}
      value={tag}
      checked={checked}
      onChange={onChange}
    />
    <span className="inline-flex min-h-9 min-w-9 max-w-full cursor-pointer items-center gap-1.5 rounded-control border border-transparent bg-surface-muted px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent-primary peer-checked:bg-accent-primary peer-checked:text-ink-inverse peer-focus-visible:ring-2 peer-focus-visible:ring-focus peer-disabled:cursor-not-allowed peer-disabled:opacity-50 pointer-coarse:min-h-touch pointer-coarse:min-w-touch">
      {checked ? <AiOutlineCheck aria-hidden="true" className="size-3.5 shrink-0" /> : null}
      <span className="min-w-0 break-all">{tag}</span>
    </span>
  </label>
);

export const TagFilter: React.FC<TagFilterProps> = (props) => {
  const { t } = useTranslation();
  const idPrefix = useId();
  const [expanded, setExpanded] = useState(false);
  const matchAnyRef = useRef<HTMLInputElement>(null);
  const tagRefs = useRef(new Map<string, HTMLInputElement>());
  const pendingExpandedTagFocusRef = useRef<string | null>(null);
  const headingId = `${idPrefix}-tags-heading`;
  const matchHeadingId = `${idPrefix}-match-heading`;
  const tagListId = `${idPrefix}-tags-list`;
  const tagInputName = `${idPrefix}-tags`;
  const radioGroupName = `${idPrefix}-tag-match`;
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
      ? t("deckFilter.tagFilter.noFilter")
      : t("deckFilter.tagFilter.selected", { count: selectedTags.length });

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
      className="@container/tag-filter min-w-0 space-y-4 rounded-surface border border-border bg-surface p-4 md:p-5"
    >
      <header className="flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 id={headingId} className="text-lg font-medium text-ink">
            {t("deckFilter.tagFilter.title")}
          </h2>
          <p aria-live="polite" className="text-xs text-ink-muted">
            {status}
          </p>
        </div>
        <button
          type="button"
          className="min-h-8 shrink-0 rounded-control text-sm text-accent-primary underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-ink-muted disabled:no-underline pointer-coarse:min-h-touch"
          disabled={selectedTags.length === 0}
          onClick={() => {
            // Clearing disables this button, so focus a control that remains operable first.
            matchAnyRef.current?.focus();
            props.onSelectedTagsChange([]);
          }}
        >
          {t("deckFilter.tagFilter.clear")}
        </button>
      </header>

      <fieldset aria-labelledby={matchHeadingId}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 @lg/tag-filter:grid @lg/tag-filter:grid-cols-[6rem_minmax(0,1fr)] @lg/tag-filter:gap-x-4">
          <span id={matchHeadingId} className="text-sm text-ink-muted">
            {t("deckFilter.tagFilter.match")}
          </span>
          <div className="inline-flex w-fit max-w-full flex-wrap gap-1 rounded-control bg-surface-muted p-1">
            <label className="relative inline-flex cursor-pointer">
              <input
                ref={matchAnyRef}
                type="radio"
                name={radioGroupName}
                value="any"
                checked={!props.matchAll}
                className="peer sr-only"
                onChange={() => props.onMatchAllChange(false)}
              />
              <span className="inline-flex min-h-8 items-center rounded-md px-3 text-sm text-ink-muted peer-checked:bg-surface peer-checked:text-ink peer-focus-visible:ring-2 peer-focus-visible:ring-focus peer-disabled:cursor-not-allowed peer-disabled:opacity-50 pointer-coarse:min-h-touch">
                {t("deckFilter.tagFilter.any")}
              </span>
            </label>
            <label className="relative inline-flex cursor-pointer">
              <input
                type="radio"
                name={radioGroupName}
                value="all"
                checked={props.matchAll}
                className="peer sr-only"
                onChange={() => props.onMatchAllChange(true)}
              />
              <span className="inline-flex min-h-8 items-center rounded-md px-3 text-sm text-ink-muted peer-checked:bg-surface peer-checked:text-ink peer-focus-visible:ring-2 peer-focus-visible:ring-focus peer-disabled:cursor-not-allowed peer-disabled:opacity-50 pointer-coarse:min-h-touch">
                {t("deckFilter.tagFilter.all")}
              </span>
            </label>
          </div>
        </div>
      </fieldset>

      {/* The label stays outside the scrolling choices so the row remains identifiable with many tags. */}
      <div className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-3 border-t border-border pt-4 @lg/tag-filter:grid-cols-[6rem_minmax(0,1fr)]">
        <span className="text-sm text-ink-muted @lg/tag-filter:pt-2">{t("deckFilter.tagFilter.choicesLabel")}</span>
        <div className="min-w-0 space-y-2">
          <fieldset
            id={tagListId}
            aria-label={t("deckFilter.tagFilter.choicesAria")}
            className={visibleTags.length > 30 ? "-m-0.5 max-h-64 overflow-y-auto p-0.5" : "-m-0.5 p-0.5"}
          >
            {visibleTags.length === 0 ? (
              <p className="text-caption text-ink-muted">{t("deckFilter.tagFilter.empty")}</p>
            ) : (
              <div className="flex min-w-0 flex-wrap gap-2">
                {visibleTags.map((tag) => (
                  <TagFilterChoice
                    key={tag}
                    ref={(element) => {
                      if (element === null) tagRefs.current.delete(tag);
                      else tagRefs.current.set(tag, element);
                    }}
                    tag={tag}
                    name={tagInputName}
                    checked={selectedTagSet.has(tag)}
                    onChange={() => toggleTag(tag)}
                  />
                ))}
              </div>
            )}
          </fieldset>

          {hiddenTagCount > 0 ? (
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={tagListId}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-control text-sm text-accent-primary underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-ink-muted pointer-coarse:min-h-touch"
              onClick={(event) => {
                if (!expanded && event.detail === 0) {
                  // Keyboard activation inserts the revealed tags before this button. Move focus to
                  // the first new tag so forward Tab reaches the newly available choices.
                  pendingExpandedTagFocusRef.current = unselectedTags[COLLAPSED_UNSELECTED_TAG_LIMIT] ?? null;
                }
                setExpanded((current) => !current);
              }}
            >
              {expanded
                ? t("deckFilter.tagFilter.showFewer")
                : t("deckFilter.tagFilter.showMore", { count: hiddenTagCount })}
              {expanded ? <AiOutlineUp aria-hidden="true" /> : <AiOutlineDown aria-hidden="true" />}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
};
