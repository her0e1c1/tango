/**
 * @file Defines the reusable Tag List component in the shared content library.
 * Feature screens compose this building block through props instead of duplicating presentation
 * and interaction rules.
 */

import type * as React from "react";
import cx from "classnames";

/**
 * Renders the Tag List user interface.
 * Lays out tag children in a wrapping row and adjusts spacing when the list contains many items.
 */
export const TagList: React.FC<{
  hasManyItems?: boolean;
  children?: React.ReactNode;
}> = (props) => {
  return (
    <div
      className={cx("flex min-w-0 flex-wrap gap-2 overflow-x-hidden", props.hasManyItems && "max-h-64 overflow-y-auto")}
    >
      {props.children}
    </div>
  );
};
