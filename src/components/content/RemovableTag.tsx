/**
 * @file Defines the reusable Removable Tag component in the shared content library.
 * Feature screens compose this building block through props instead of duplicating presentation
 * and interaction rules.
 */

import type * as React from "react";

import { TagMarker, tagClassName } from "@/components/content/tagStyles";

export interface RemovableTagProps {
  className?: string;
  label: string;
  onRemove: (label: string) => void;
}

/**
 * Renders the Removable Tag user interface.
 * Displays a selected filter as a button and calls onRemove when the user asks to remove that
 * label.
 */
export const RemovableTag: React.FC<RemovableTagProps> = ({ className, label, onRemove }) => (
  <button
    type="button"
    aria-label={`Remove ${label} filter`}
    className={tagClassName({
      interactive: true,
      selected: true,
      ...(className !== undefined ? { className } : {}),
    })}
    onClick={() => onRemove(label)}
  >
    <TagMarker selected />
    <span className="min-w-0 max-w-full truncate">{label}</span>
    <span aria-hidden="true" className="ml-2 shrink-0">
      ×
    </span>
  </button>
);
