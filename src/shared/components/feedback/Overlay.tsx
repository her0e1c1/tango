import cx from "classnames";
import type * as React from "react";
import { useButtonInteraction } from "@/shared/components/feedback/buttonInteraction";

export const Overlay: React.FC<{
  className?: string;
  position: "left" | "right" | "top" | "bottom" | "center";
  onClick?: () => void;
  ariaLabel?: string;
  children?: React.ReactNode;
}> = (props) => {
  const clickInteraction = useButtonInteraction<HTMLDivElement>(props.onClick);
  return (
    <div
      {...clickInteraction}
      {...(props.onClick !== undefined && props.ariaLabel !== undefined ? { "aria-label": props.ariaLabel } : {})}
      className={cx([
        props.className,
        "absolute",
        "z-10",
        ["left", "right"].includes(props.position) && "w-20",
        ["top", "bottom"].includes(props.position) && "h-10",
        props.position === "center" && ["top-0", "bottom-0", "left-0", "right-0"],
        props.position === "left" && ["top-0", "bottom-0", "left-0"],
        props.position === "right" && ["top-0", "bottom-0", "right-0"],
        props.position === "top" && ["top-0", "left-0", "right-0"],
        props.position === "bottom" && ["bottom-0", "left-0", "right-0"],
      ])}
    >
      {props.children}
    </div>
  );
};
