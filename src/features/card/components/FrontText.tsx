import cx from "classnames";
import * as React from "react";
import { Title, Math } from "@src/shared/components";
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

export const FrontText: React.FC<FrontTextProps> = (props) => {
  const handlers = useSwipeable({
    ...(props.onSwipeLeft !== undefined ? { onSwipedLeft: props.onSwipeLeft } : {}),
    ...(props.onSwipeUp !== undefined ? { onSwipedUp: props.onSwipeUp } : {}),
    ...(props.onSwipeRight !== undefined ? { onSwipedRight: props.onSwipeRight } : {}),
    ...(props.onSwipeDown !== undefined ? { onSwipedDown: props.onSwipeDown } : {}),
  });
  return (
    <div
      id="frontText"
      onClick={props.onClick}
      className={cx("flex", "justify-center", "items-center", "h-full")}
      {...handlers}
    >
      {props.category === "math" ? <Math text={props.text} /> : <Title>{props.text}</Title>}
    </div>
  );
};
