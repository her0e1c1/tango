import cx from "classnames";
import type * as React from "react";
import { useButtonInteraction } from "@/shared/components/feedback/buttonInteraction";

export const Title: React.FC<{ className?: string; onClick?: () => void; children: React.ReactNode }> = (props) => {
  const clickInteraction = useButtonInteraction<HTMLDivElement>(props.onClick);
  return (
    <div
      {...clickInteraction}
      className={cx(
        "inline-block font-bold text-xl mr-2",
        "text-black dark:text-gray-300",
        { "cursor-pointer hover:opacity-50": props.onClick },
        props.className
      )}
    >
      {props.children}
    </div>
  );
};
