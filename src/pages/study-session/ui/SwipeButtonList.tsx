import type * as React from "react";
import { AiOutlineArrowUp, AiOutlineArrowDown, AiOutlineArrowLeft, AiOutlineArrowRight } from "react-icons/ai";
import { useTranslation } from "react-i18next";
import type { SwipeDirection } from "@/entities/preference";

const directions: SwipeDirection[] = ["cardSwipeLeft", "cardSwipeUp", "cardSwipeDown", "cardSwipeRight"];
const icons = {
  cardSwipeUp: AiOutlineArrowUp,
  cardSwipeDown: AiOutlineArrowDown,
  cardSwipeLeft: AiOutlineArrowLeft,
  cardSwipeRight: AiOutlineArrowRight,
};
const labelKeys = {
  cardSwipeUp: "studySession.swipeActions.up",
  cardSwipeDown: "studySession.swipeActions.down",
  cardSwipeLeft: "studySession.swipeActions.left",
  cardSwipeRight: "studySession.swipeActions.right",
} as const;

export interface SwipeButtonListProps {
  disabled?: boolean;
  onClickUp?: () => void;
  onClickDown?: () => void;
  onClickLeft?: () => void;
  onClickRight?: () => void;
}

export const SwipeButtonList: React.FC<SwipeButtonListProps> = (props) => {
  const { t } = useTranslation();

  return (
    <fieldset className="mx-auto grid w-full max-w-content grid-cols-4 gap-2 border-0 p-0">
      <legend className="sr-only">{t("studySession.swipeActions.legend")}</legend>
      {directions.map((d) => (
        <button
          type="button"
          aria-label={t(labelKeys[d])}
          key={d}
          className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-control border border-transparent text-ink-muted transition-colors duration-fast ease-calm hover:border-border hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50"
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
          <span className="flex justify-center text-2xl sm:text-3xl">
            {(() => {
              const Icon = icons[d];
              return <Icon aria-hidden="true" />;
            })()}
          </span>
        </button>
      ))}
    </fieldset>
  );
};
