import cx from "classnames";
import * as React from "react";

export const Logo: React.FC<{ onClick?: () => void; className?: string }> = (props) => (
  <div
    onClick={props.onClick}
    className={cx("text-2xl font-semibold italic text-indigo-500 dark:text-indigo-700", props.className)}
  >
    tango
  </div>
);
