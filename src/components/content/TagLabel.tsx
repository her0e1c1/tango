/**
 * @file Defines the reusable Tag Label component in the shared content library.
 * Feature screens compose this building block through props instead of duplicating presentation
 * and interaction rules.
 */

import type * as React from "react";

import { TagMarker, tagClassName } from "@/components/content/tagStyles";

export interface TagLabelProps {
  className?: string;
  label: string;
  selected?: boolean;
}

/**
 * Renders the Tag Label user interface.
 * Displays a compact tag label and reflects whether the tag is currently selected.
 */
export const TagLabel: React.FC<TagLabelProps> = ({ className, label, selected }) => (
  <span
    className={tagClassName({
      compact: true,
      ...(className !== undefined ? { className } : {}),
      ...(selected !== undefined ? { selected } : {}),
    })}
    title={label}
  >
    <TagMarker {...(selected !== undefined ? { selected } : {})} />
    <span className="min-w-0 max-w-full truncate">{label}</span>
  </span>
);
