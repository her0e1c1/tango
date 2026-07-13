import cx from "classnames";
import * as React from "react";

export const Title: React.FC<{ className?: string; onClick?: () => void; children: React.ReactNode }> = (props) => (
  <div
    className={cx(
      "inline-block font-bold text-xl mr-2",
      "text-black dark:text-gray-300",
      { "cursor-pointer hover:opacity-50": props.onClick },
      props.className
    )}
    onClick={props.onClick}
  >
    {props.children}
  </div>
);
