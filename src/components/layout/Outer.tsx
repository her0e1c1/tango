/**
 * @file Defines the reusable Outer component in the shared layout library.
 * Feature screens compose this building block through props instead of duplicating presentation
 * and interaction rules.
 */

import cx from "classnames";
import type * as React from "react";

/**
 * Renders the Outer user interface.
 * Provides the application-wide canvas, text colors, minimum height, and optional caller styling
 * around its children.
 */
export const Outer: React.FC<{ children?: React.ReactNode; className?: string }> = (props) => {
  return (
    <div
      className={cx(
        "bg-canvas",
        "text-ink",
        "cursor-default",
        "select-none",
        "h-dvh",
        "min-h-dvh",
        "w-full",
        "overflow-x-hidden",
        "overflow-y-auto",
        "flex",
        "flex-col",
        props.className
      )}
    >
      {props.children}
    </div>
  );
};
