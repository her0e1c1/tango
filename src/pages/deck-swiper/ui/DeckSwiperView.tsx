/**
 * @file Composes the Deck Swiper Page's presentation.
 * Data and callbacks arrive through props, which keeps this presentation usable in Storybook.
 */

import cx from "classnames";
import type * as React from "react";
import { Overlay } from "@/shared/ui/feedback";
import { Controller, type ControllerProps, SwipeButtonList, type SwipeButtonListProps } from "@/features/study";

const SWIPE_FEEDBACK_LABEL: Record<SwipeDirection, string> = {
  cardSwipeUp: "Swiped up",
  cardSwipeDown: "Swiped down",
  cardSwipeLeft: "Swiped left",
  cardSwipeRight: "Swiped right",
};

export interface DeckSwiperViewProps {
  showBackText?: boolean;
  showSwipeButtonList?: boolean;
  showController?: boolean;
  swipeFeedback?: SwipeDirection;
  backTextSlot?: React.ReactNode;
  cardOverlaySlot?: React.ReactNode;
  frontTextSlot?: React.ReactNode;
  swipeOverlay?: SwipeButtonListProps;
  controller?: ControllerProps;
  swipeButtonList?: SwipeButtonListProps;
  feedbackSlot?: React.ReactNode;
}

/**
 * Composes the Deck Swiper screen from reusable UI components.
 * All data and callbacks arrive through props, allowing the same screen to run in tests and
 * Storybook.
 */
export const DeckSwiperView: React.FC<DeckSwiperViewProps> = (props) => {
  return (
    <>
      {props.feedbackSlot}
      {props.swipeFeedback !== undefined ? (
        <div
          role="status"
          className="pointer-events-none fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-control bg-surface px-4 py-2 text-body font-bold text-ink shadow-surface"
        >
          {SWIPE_FEEDBACK_LABEL[props.swipeFeedback]}
        </div>
      ) : null}
      {props.showBackText && props.backTextSlot != null ? (
        <>
          <Overlay
            position="left"
            ariaLabel="Swipe left"
            {...(props.swipeOverlay?.onClickLeft !== undefined ? { onClick: props.swipeOverlay.onClickLeft } : {})}
          />
          <Overlay
            position="right"
            ariaLabel="Swipe right"
            {...(props.swipeOverlay?.onClickRight !== undefined ? { onClick: props.swipeOverlay.onClickRight } : {})}
          />
          <Overlay
            position="top"
            ariaLabel="Swipe up"
            {...(props.swipeOverlay?.onClickUp !== undefined ? { onClick: props.swipeOverlay.onClickUp } : {})}
          />
          <Overlay
            position="bottom"
            ariaLabel="Swipe down"
            {...(props.swipeOverlay?.onClickDown !== undefined ? { onClick: props.swipeOverlay.onClickDown } : {})}
          />
          <div className="h-full flex pb-8">{props.backTextSlot}</div>
        </>
      ) : props.frontTextSlot != null ? (
        <div className="h-full flex flex-col relative">
          {props.cardOverlaySlot}
          {props.frontTextSlot}
        </div>
      ) : null}
      {props.showSwipeButtonList || props.showController ? (
        <div className={cx("fixed w-full bottom-2", "pb-5", props.showBackText && "invisible")}>
          {props.showSwipeButtonList ? <SwipeButtonList {...props.swipeButtonList} /> : null}
          {props.showController ? <Controller {...props.controller} /> : null}
        </div>
      ) : null}
    </>
  );
};
