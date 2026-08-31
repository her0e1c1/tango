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
  category?: string;
  onClick?: () => void;
  autoFocus?: boolean;
}

/**
 * Renders the Front Text user interface.
 * Displays a card's prompt content, including rich text and optional code or mathematical
 * notation.
 */
export const FrontText: React.FC<FrontTextProps> = (props) => {
  const clickInteraction = useButtonInteraction<HTMLDivElement>(props.onClick);
  const frontRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (props.autoFocus) frontRef.current?.focus();
  }, [props.autoFocus]);

  return (
    <div
      id="frontText"
      ref={frontRef}
      className={cx(
        "mx-auto flex h-full w-full min-w-0 max-w-content items-center justify-center break-words py-section-gap pl-[calc(var(--spacing-study-inline)+env(safe-area-inset-left))] pr-[calc(var(--spacing-study-inline)+env(safe-area-inset-right))] text-ink"
      )}
      {...clickInteraction}
    >
      {props.category === "math" ? <MathContent text={props.text} /> : <Title>{props.text}</Title>}
    </div>
  );
};
