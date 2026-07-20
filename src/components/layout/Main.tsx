/**
 * @file Defines the reusable Main component in the shared layout library.
 * Feature screens compose this building block through props instead of duplicating presentation
 * and interaction rules.
 */

import cx from "classnames";
import type * as React from "react";

/**
 * Renders the Main user interface.
 * Constrains primary page content to the shared reading width and applies consistent horizontal
 * and vertical spacing.
 */
export const Main: React.FC<{ children?: React.ReactNode }> = (props) => {
  return (
    <div
      className={cx(
        "mx-auto",
        "mt-section-gap",
        "flex",
        "w-full",
        "max-w-content",
        "flex-1",
        "flex-col",
        "gap-section-gap",
        "rounded-surface",
        "bg-surface",
        "px-shell-gutter",
        "py-section-gap",
        "text-ink",
        "shadow-surface"
      )}
    >
      {props.children}
    </div>
  );
};
