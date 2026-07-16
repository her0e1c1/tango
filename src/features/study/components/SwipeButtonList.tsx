import type * as React from "react";
import { AiOutlineArrowUp, AiOutlineArrowDown, AiOutlineArrowLeft, AiOutlineArrowRight } from "react-icons/ai";

const directions: SwipeDirection[] = ["cardSwipeLeft", "cardSwipeUp", "cardSwipeDown", "cardSwipeRight"];
const icons = {
  cardSwipeUp: AiOutlineArrowUp,
  cardSwipeDown: AiOutlineArrowDown,
  cardSwipeLeft: AiOutlineArrowLeft,
  cardSwipeRight: AiOutlineArrowRight,
};
const labels = {
  cardSwipeUp: "Swipe up",
  cardSwipeDown: "Swipe down",
  cardSwipeLeft: "Swipe left",
  cardSwipeRight: "Swipe right",
};

export interface SwipeButtonListProps {
  disabled?: boolean;
  onClickUp?: () => void;
  onClickDown?: () => void;
  onClickLeft?: () => void;
  onClickRight?: () => void;
}

export const SwipeButtonList: React.FC<SwipeButtonListProps> = (props) => {
  return (
    <div className="flex">
      {directions.map((d) => (
        <button
          type="button"
          aria-label={labels[d]}
          key={d}
          className="flex-1 items-center content-center hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
          disabled={props.disabled}
          onClick={() => {
            if (d === "cardSwipeUp") {
              props.onClickUp?.();
            } else if (d === "cardSwipeDown") {
              props.onClickDown?.();
            } else if (d === "cardSwipeLeft") {
              props.onClickLeft?.();
            } else {
              props.onClickRight?.();
            }
          }}
        >
          <span className="flex justify-center text-4xl lg:text-6xl">
            {(() => {
              const Icon = icons[d];
              return <Icon />;
            })()}
          </span>
        </button>
      ))}
    </div>
  );
};
