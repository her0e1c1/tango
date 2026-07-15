import cx from "classnames";
import type * as React from "react";
import { useButtonInteraction } from "@/shared/components/feedback/buttonInteraction";

export const FullScreen: React.FC<{
  className?: string;
  scroll?: boolean;
  center?: boolean;
  flex?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}> = (props) => {
  const clickInteraction = useButtonInteraction<HTMLDivElement>(props.onClick);
  return (
    <div
      {...clickInteraction}
      className={cx([
        "bg-canvas",
        "w-screen",
        "h-screen",
        props.flex && ["flex", "flex-col"],
        props.scroll ? "overflow-scroll" : "overflow-hidden",
        props.center && ["flex", "justify-center", "items-center"],
        props.className,
      ])}
    >
      {props.children}
    </div>
  );
};
