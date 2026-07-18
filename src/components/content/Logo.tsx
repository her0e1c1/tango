import cx from "classnames";
import type * as React from "react";
import { useButtonInteraction } from "@/components/feedback/buttonInteraction";

export const Logo: React.FC<{ onClick?: () => void; className?: string; markOnly?: boolean }> = (props) => {
  const clickInteraction = useButtonInteraction<HTMLDivElement>(props.onClick);
  return (
    <div {...clickInteraction} className={cx("inline-flex items-center", props.className)}>
      {props.markOnly ? (
        <img src="/tango-mark.svg" alt="" aria-hidden="true" width={32} height={32} className="size-8" />
      ) : (
        <>
          <img
            src="/tango-logo.svg"
            alt=""
            aria-hidden="true"
            width={108}
            height={32}
            className="h-8 w-[108px] dark:hidden"
          />
          <img
            src="/tango-logo-dark.svg"
            alt=""
            aria-hidden="true"
            width={108}
            height={32}
            className="hidden h-8 w-[108px] dark:block"
          />
        </>
      )}
      <span className="sr-only">tango</span>
    </div>
  );
};
