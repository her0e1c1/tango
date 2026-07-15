import cx from "classnames";
import type * as React from "react";
import { useButtonInteraction } from "@/shared/components/feedback/buttonInteraction";

export const Logo: React.FC<{ onClick?: () => void; className?: string; markOnly?: boolean }> = (props) => {
  const clickInteraction = useButtonInteraction<HTMLDivElement>(props.onClick);
  return (
    <div {...clickInteraction} className={cx("text-2xl font-semibold italic text-accent-primary", props.className)}>
      <img
        className={cx("inline-block size-8 align-middle", !props.markOnly && "mr-2")}
        src="/tango-mark.svg"
        alt=""
        aria-hidden="true"
        width={32}
        height={32}
      />
      {props.markOnly ? <span className="sr-only">tango</span> : "tango"}
    </div>
  );
};
