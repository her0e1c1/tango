/**
 * @file Defines the reusable Tag Styles component in the shared content library.
 * Feature screens compose this building block through props instead of duplicating presentation
 * and interaction rules.
 */

import cx from "classnames";
import type * as React from "react";

export interface TagStyleOptions {
  className?: string;
  compact?: boolean;
  interactive?: boolean;
  selected?: boolean;
}

/**
 * Builds the shared CSS class list for a tag's size, selection, and interaction state.
 * Both form and content tags use this helper to stay visually consistent.
 */
export const tagClassName = ({ className, compact, interactive, selected }: TagStyleOptions) =>
  cx(
    "inline-flex max-w-full min-w-0 items-center border font-medium",
    "rounded-control border-border bg-surface text-ink",
    compact ? "min-h-6 px-2 py-0.5 text-xs" : "min-h-touch min-w-touch px-3 py-2 text-sm",
    interactive &&
      "cursor-pointer transition-colors duration-fast ease-calm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
    selected && "border-accent-primary bg-accent-primary/10 text-accent-primary",
    className
  );

/**
 * Renders the Tag Marker user interface.
 * Displays the small decorative dot that distinguishes a selected tag from an unselected tag.
 */
export const TagMarker: React.FC<{ selected?: boolean }> = ({ selected }) => (
  <span
    aria-hidden="true"
    className={cx(
      "mr-2 size-2 shrink-0 rounded-pill bg-ink-muted",
      selected && "bg-accent-primary ring-2 ring-accent-primary/20"
    )}
  />
);
