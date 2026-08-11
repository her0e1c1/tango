/**
 * @file Defines the reusable Card component in the shared content library.
 * Feature screens compose this building block through props instead of duplicating presentation
 * and interaction rules.
 */

import cx from "classnames";
import type * as React from "react";

/**
 * Renders the Card user interface.
 * Wraps child content in the shared card surface, with optional full-width, border, and disabled
 * styles.
 */
export const Card: React.FC<{
  className?: string;
  full?: boolean;
  disabled?: boolean;
  border?: boolean;
  children?: React.ReactNode;
}> = (props) => {
  return (
    <div className={cx("flex", props.full ? "w-full" : ["w-full", "md:w-1/2", "lg:w-1/3"])}>
      <div
        className={cx(
          "flex min-w-0 flex-1 flex-col justify-between gap-3 overflow-hidden rounded-surface p-4 text-ink shadow-surface md:p-5",
          props.disabled ? "bg-surface-muted" : "bg-surface",
          props.border && "border border-border dark:border-black",
          props.className
        )}
      >
        {props.children}
      </div>
    </div>
  );
};
