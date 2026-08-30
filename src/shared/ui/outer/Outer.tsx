/**
 * @file Defines the reusable Outer component.
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
export const Outer: React.FC<{ children?: React.ReactNode; className?: string }> = (props) => (
  <section
    aria-label="Application shell"
    // biome-ignore lint/a11y/noNoninteractiveTabindex: The application shell owns viewport scrolling and must be keyboard reachable.
    tabIndex={0}
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
  </section>
);
