/**
 * @file Defines the Card Entity's Front Text presentation component.
 * The component renders prepared Card content and reports user intent through callbacks while data
 * access stays outside the view.
 */

import cx from "classnames";
import * as React from "react";
import { useButtonInteraction } from "@/shared/ui/button-interaction";
import { MathContent, Title } from "@/shared/ui/content";

export interface FrontTextProps {
  text: string;
  viewMode?: boolean;
  ariaLabel?: string;
  category?: string;
  onClick?: () => void;
}

/**
 * Renders the Front Text user interface.
 * Displays a card's prompt content, including rich text and optional code or mathematical
 * notation.
 */
export const FrontText: React.FC<FrontTextProps> = (props) => {
  const contentId = React.useId();
  const content = props.category === "math" ? <MathContent text={props.text} /> : <Title>{props.text}</Title>;
  const buttonInteraction = useButtonInteraction<HTMLDivElement>(props.viewMode ? undefined : props.onClick);
  const clickInteraction = {
    ...buttonInteraction,
    ...(!props.viewMode && props.onClick !== undefined && props.ariaLabel !== undefined
      ? { "aria-label": props.ariaLabel, "aria-describedby": contentId }
      : {}),
  };
  return (
    <div
      id="frontText"
      className={cx(
        "mx-auto flex w-full min-w-0 max-w-content justify-center break-words py-section-gap pl-[calc(var(--spacing-study-inline)+env(safe-area-inset-left))] pr-[calc(var(--spacing-study-inline)+env(safe-area-inset-right))] text-ink",
        props.viewMode ? "h-auto items-start" : "h-full items-center"
      )}
      {...clickInteraction}
    >
      {props.ariaLabel === undefined ? (
        content
      ) : (
        <div id={contentId} className="min-w-0">
          {content}
        </div>
      )}
    </div>
  );
};
