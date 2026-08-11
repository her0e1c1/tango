/**
 * @file Defines the reusable Description component in the shared content library.
 * Feature screens compose this building block through props instead of duplicating presentation
 * and interaction rules.
 */

import cx from "classnames";
import type * as React from "react";

/**
 * Renders the Description user interface.
 * Displays a compact muted label, using the label prop when present and otherwise rendering its
 * children.
 */
export const Description: React.FC<{ label?: string; className?: string; children?: React.ReactNode }> = (props) => (
  <div className={cx("inline-block min-w-0 break-words text-caption text-ink-muted", props.className)}>
    {props.label ?? props.children}
  </div>
);
