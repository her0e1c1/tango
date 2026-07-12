import cx from "classnames";
import * as React from "react";
import * as Shared from "@src/shared/components";
import * as Organism from "@src/component/Organism";
import { Layout } from "@src/shared/components/Layout";
import { BackText } from "@src/features/card/components/BackText";
import { CardOverlay } from "@src/features/card/components/CardOverlay";
import { FrontText } from "@src/features/card/components/FrontText";

export const DeckSwiper: React.FC<{
  showHeader?: boolean;
  showBackText?: boolean;
  showSwipeButtonList?: boolean;
  showController?: boolean;
  layout?: LayoutProps;
  card?: Card;
  backText?: BackTextProps;
  frontText?: FrontTextProps;
  controller?: ControllerProps;
  swipeButtonList?: SwipeButtonListProps;
}> = (props) => {
  return (
    <Layout
      fullscreen
      showHeader={props.showHeader && !props.showBackText}
      scroll={props.showBackText}
      {...props.layout}
    >
      {props.showBackText && props.backText != null ? (
        <>
          <Shared.Overlay position="left" onClick={props.frontText?.onSwipeLeft} />
          <Shared.Overlay position="right" onClick={props.frontText?.onSwipeRight} />
          <Shared.Overlay position="top" onClick={props.frontText?.onSwipeUp} />
          <Shared.Overlay position="bottom" onClick={props.frontText?.onSwipeDown} />
          <div className="h-full flex pb-8">
            <BackText {...props.backText} />
          </div>
        </>
      ) : props.frontText != null ? (
        <div className="h-full flex flex-col relative">
          <CardOverlay card={props.card} />
          <FrontText {...props.frontText} />
        </div>
      ) : null}
      {(props.showSwipeButtonList || props.showController) && (
        <div className={cx("fixed w-full bottom-2", "pb-5", props.showBackText && "invisible")}>
          {props.showSwipeButtonList && <Organism.SwipeButtonList {...props.swipeButtonList} />}
          {props.showController && <Organism.Controller {...props.controller} />}
        </div>
      )}
    </Layout>
  );
};
