/**
 * @file Defines the reusable Title component in the shared content library.
 * Feature screens compose this building block through props instead of duplicating presentation
 * and interaction rules.
 */

import cx from "classnames";
import type * as React from "react";
import { useButtonInteraction } from "@/components/feedback/buttonInteraction";

/**
 * Renders the Title user interface.
 * Displays prominent title content and adds keyboard-accessible click behavior when onClick is
 * provided.
 */
export const Title: React.FC<{ className?: string; onClick?: () => void; children: React.ReactNode }> = (props) => {
  const clickInteraction = useButtonInteraction<HTMLDivElement>(props.onClick);
  return (
    <div
      {...clickInteraction}
      className={cx(
        "mr-2 inline-block min-w-0 break-words text-title font-bold text-ink",
        { "cursor-pointer transition-opacity duration-fast ease-calm hover:opacity-70": props.onClick },
        props.className
      )}
    >
      {props.children}
    </div>
  );
};
