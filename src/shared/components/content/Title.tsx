import cx from "classnames";
import type * as React from "react";
import { useButtonInteraction } from "@/shared/components/feedback/buttonInteraction";

export const Title: React.FC<{ className?: string; onClick?: () => void; children: React.ReactNode }> = (props) => {
  const clickInteraction = useButtonInteraction<HTMLDivElement>(props.onClick);
  return (
    <div
      {...clickInteraction}
      className={cx(
        "mr-2 inline-block min-w-0 break-words text-title font-bold text-ink",
        { "cursor-pointer transition-opacity duration-fast ease-calm hover:opacity-70": props.onClick },
        props.className
      )}
    >
      {props.children}
    </div>
  );
};
