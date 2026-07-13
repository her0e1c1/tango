import cx from "classnames";
import * as React from "react";
import * as Shared from "@src/shared/components";
import { Layout } from "@src/shared/components/Layout";
import { Controller } from "@src/features/study/components/Controller";
import { SwipeButtonList } from "@src/features/study/components/SwipeButtonList";

export interface DeckSwiperTemplateProps {
  showHeader?: boolean;
  showBackText?: boolean;
  showSwipeButtonList?: boolean;
  showController?: boolean;
  layout?: LayoutProps;
  backTextSlot?: React.ReactNode;
  cardOverlaySlot?: React.ReactNode;
  frontTextSlot?: React.ReactNode;
  swipeOverlay?: SwipeButtonListProps;
  controller?: ControllerProps;
  swipeButtonList?: SwipeButtonListProps;
}

export const DeckSwiperTemplate: React.FC<DeckSwiperTemplateProps> = (props) => {
  return (
    <Layout
      fullscreen
      showHeader={props.showHeader && !props.showBackText}
      scroll={props.showBackText}
      {...props.layout}
    >
      {props.showBackText && props.backTextSlot != null ? (
        <>
          <Shared.Overlay position="left" onClick={props.swipeOverlay?.onClickLeft} />
          <Shared.Overlay position="right" onClick={props.swipeOverlay?.onClickRight} />
          <Shared.Overlay position="top" onClick={props.swipeOverlay?.onClickUp} />
          <Shared.Overlay position="bottom" onClick={props.swipeOverlay?.onClickDown} />
          <div className="h-full flex pb-8">{props.backTextSlot}</div>
        </>
      ) : props.frontTextSlot != null ? (
        <div className="h-full flex flex-col relative">
          {props.cardOverlaySlot}
          {props.frontTextSlot}
        </div>
      ) : null}
      {(props.showSwipeButtonList || props.showController) && (
        <div className={cx("fixed w-full bottom-2", "pb-5", props.showBackText && "invisible")}>
          {props.showSwipeButtonList && <SwipeButtonList {...props.swipeButtonList} />}
          {props.showController && <Controller {...props.controller} />}
        </div>
      )}
    </Layout>
  );
};
