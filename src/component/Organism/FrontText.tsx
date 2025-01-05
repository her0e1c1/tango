import cx from "classnames";
import * as React from "react";
import { Title, Math } from "../Atom";
import { useSwipeable } from "react-swipeable";

export const FrontText: React.FC<FrontTextProps> = (props) => {
  const handlers = useSwipeable({
    onSwipedLeft: props.onSwipeLeft,
    onSwipedUp: props.onSwipeUp,
    onSwipedRight: props.onSwipeRight,
    onSwipedDown: props.onSwipeDown,
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
