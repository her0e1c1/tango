import cx from "classnames";
import type * as React from "react";
import { useButtonInteraction } from "@/shared/components/feedback/buttonInteraction";

export const Logo: React.FC<{ onClick?: () => void; className?: string }> = (props) => {
  const clickInteraction = useButtonInteraction<HTMLDivElement>(props.onClick);
  return (
    <div
      {...clickInteraction}
      className={cx("text-2xl font-semibold italic text-indigo-500 dark:text-indigo-700", props.className)}
    >
      tango
    </div>
  );
};
