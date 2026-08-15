/** @file Defines the decorative selection marker shared by tag presentations. */

import cx from "classnames";
import type * as React from "react";

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
