/**
 * @file Defines the reusable Style component in the shared content library.
 * Feature screens compose this building block through props instead of duplicating presentation
 * and interaction rules.
 */

import cx from "classnames";
import type * as React from "react";

/**
 * Renders the Style user interface.
 * Applies the shared rich-content typography to a span or div and supports optional click
 * interaction.
 */
export const Style: React.FC<{
  div?: boolean;
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}> = (props) => {
  const Tag = props.div ? "div" : "span";
  return (
    <Tag onClick={props.onClick} className={cx("min-w-0 break-words text-ink", props.className)}>
      {props.children}
    </Tag>
  );
};
