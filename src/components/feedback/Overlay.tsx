import cx from "classnames";
import type * as React from "react";
import { useButtonInteraction } from "@/components/feedback/buttonInteraction";

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
      className={cx(
        "absolute z-10 max-h-full max-w-full overflow-x-hidden overflow-y-auto rounded-control bg-surface-elevated text-ink shadow-elevated",
        "before:pointer-events-none before:fixed before:inset-0 before:-z-10 before:bg-canvas/70",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2",
        ["left", "right"].includes(props.position) && "w-20",
        ["top", "bottom"].includes(props.position) && "h-10",
        props.position === "center" && "inset-0",
        props.position === "left" && "inset-y-0 left-0",
        props.position === "right" && "inset-y-0 right-0",
        props.position === "top" && "inset-x-0 top-0",
        props.position === "bottom" && "inset-x-0 bottom-0",
        props.className
      )}
    >
      {props.children}
    </div>
  );
};
