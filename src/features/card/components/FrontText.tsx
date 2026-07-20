/**
 * @file Defines the card feature's Front Text presentation component.
 * The component renders props and reports user intent through callbacks while data access stays
 * outside the view.
 */

import cx from "classnames";
import type * as React from "react";
import { MathContent, Title, useButtonInteraction } from "@/components";
import { useSwipeable } from "react-swipeable";

export interface FrontTextProps {
  text: string;
  category?: string;
  onSwipeLeft?: () => void;
  onSwipeUp?: () => void;
  onSwipeRight?: () => void;
  onSwipeDown?: () => void;
  onClick?: () => void;
}

/**
 * Renders the Front Text user interface.
 * Displays a card's prompt content, including rich text and optional code or mathematical
 * notation.
 */
export const FrontText: React.FC<FrontTextProps> = (props) => {
  const handlers = useSwipeable({
    ...(props.onSwipeLeft !== undefined ? { onSwipedLeft: props.onSwipeLeft } : {}),
    ...(props.onSwipeUp !== undefined ? { onSwipedUp: props.onSwipeUp } : {}),
    ...(props.onSwipeRight !== undefined ? { onSwipedRight: props.onSwipeRight } : {}),
    ...(props.onSwipeDown !== undefined ? { onSwipedDown: props.onSwipeDown } : {}),
  });
  const clickInteraction = useButtonInteraction<HTMLDivElement>(props.onClick);
  return (
    <div
      id="frontText"
      className={cx(
        "mx-auto flex h-full w-full max-w-reading min-w-0 items-center justify-center break-words p-section-gap text-ink"
      )}
      {...clickInteraction}
      {...handlers}
    >
      {props.category === "math" ? <MathContent text={props.text} /> : <Title>{props.text}</Title>}
    </div>
  );
};
