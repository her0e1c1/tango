/**
 * @file Defines the deck-filter feature's Tag Filter presentation component.
 * The component renders props and reports user intent through callbacks while data access stays
 * outside the view.
 */

import { useId } from "react";
import type * as React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";
import { TagList } from "@/shared/ui/content";
import { Switch, Tag } from "@/shared/ui/forms";

/**
 * Toggles one tag in the current selection without mutating the original array.
 * Selecting an existing tag removes it; selecting a new tag appends it for the filter callback.
 */
const updateTags = (tags: string[], tag: string) => {
  if (tags.includes(tag)) {
    return tags.filter((t) => t !== tag);
  }
  return [...tags, tag];
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

/**
 * Renders the Tag Filter user interface.
 * Lets the user choose filter mode and tag selections, then reports the resulting filter or a
 * clear action.
 */
export const TagFilter: React.FC<TagFilterProps> = (props) => {
  const { t } = useTranslation();
  const idPrefix = useId();
  const headingId = `${idPrefix}-tags-heading`;
  const modeId = `${idPrefix}-tag-filter-mode`;
  const modeDescriptionId = `${idPrefix}-tag-filter-mode-description`;

  return (
    <section
      aria-labelledby={headingId}
      data-testid="tag-filter"
      className="min-w-0 space-y-4 rounded-surface border border-border bg-surface p-4 shadow-surface md:p-5"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id={headingId} className="text-title font-semibold text-ink">
            {t("deckFilter.tagFilter.title")}
          </h2>
          <p className="mt-1 text-caption text-ink-muted">{t("deckFilter.tagFilter.description")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="quiet"
            size="sm"
            label={t("deckFilter.tagFilter.all")}
            {...(props.onClickAll !== undefined ? { onClick: props.onClickAll } : {})}
          />
          <Button
            variant="quiet"
            size="sm"
            label={t("deckFilter.tagFilter.clear")}
            {...(props.onClickClear !== undefined ? { onClick: props.onClickClear } : {})}
          />
        </div>
      </header>
      <div className="flex min-h-touch items-center justify-between gap-4 rounded-control bg-surface-muted p-3">
        <div className="min-w-0">
          <label htmlFor={modeId} className="text-body font-medium text-ink">
            {t("deckFilter.tagFilter.matchAll")}
          </label>
          <p id={modeDescriptionId} className="text-caption text-ink-muted">
            {props.tagAndFilter ? t("deckFilter.tagFilter.everySelected") : t("deckFilter.tagFilter.anySelected")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-caption font-bold text-accent-primary">
            {props.tagAndFilter ? t("deckFilter.tagFilter.conjunctionAnd") : t("deckFilter.tagFilter.conjunctionOr")}
          </span>
          <Switch
            id={modeId}
            name="tag-filter-click-filter"
            aria-label={t("deckFilter.tagFilter.matchAll")}
            aria-describedby={modeDescriptionId}
            {...(props.tagAndFilter !== undefined ? { checked: props.tagAndFilter } : {})}
            onChange={(event) => props.onClickFilter?.(event.target.checked)}
          />
        </div>
      </div>
      <TagList hasManyItems={(props.tags?.length ?? 0) > 30}>
        {props.tags?.map((tag) => (
          <Tag
            className="mr-1 mb-1"
            small
            wrap
            key={tag}
            label={tag}
            {...(props.selectedTags !== undefined ? { checked: props.selectedTags.includes(tag) } : {})}
            onChange={() => props.onClickTag?.(updateTags(props.selectedTags ?? [], tag))}
          />
        ))}
      </TagList>
    </section>
  );
};
