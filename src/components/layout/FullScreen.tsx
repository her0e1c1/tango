/**
 * @file Defines the reusable Full Screen component in the shared layout library.
 * Feature screens compose this building block through props instead of duplicating presentation
 * and interaction rules.
 */

import cx from "classnames";
import type * as React from "react";
import { useButtonInteraction } from "@/components/feedback/buttonInteraction";

/**
 * Renders the Full Screen user interface.
 * Creates a viewport-sized wrapper whose children can be centered, scrollable, flex-based, or
 * clickable.
 */
export const FullScreen: React.FC<{
  className?: string;
  scroll?: boolean;
  center?: boolean;
  flex?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}> = (props) => {
  const clickInteraction = useButtonInteraction<HTMLDivElement>(props.onClick);
  return (
    <div
      {...clickInteraction}
      className={cx([
        "bg-canvas",
        "text-ink",
        "h-dvh",
        "min-h-dvh",
        "w-full",
        "max-w-full",
        props.flex && ["flex", "flex-col"],
        props.scroll ? ["overflow-x-hidden", "overflow-y-auto"] : "overflow-hidden",
        props.center && ["flex", "justify-center", "items-center"],
        props.className,
      ])}
    >
      {props.children}
    </div>
  );
};
