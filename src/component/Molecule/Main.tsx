import cx from "classnames";
import * as React from "react";

export const Main: React.FC<{ children?: React.ReactNode }> = (props) => {
  return (
    <div
      className={cx(
        "flex-1",
        "flex",
        "flex-col",
        "container",
        "mx-auto",
        "bg-white",
        "dark:bg-black",
        "dark:text-gray-100",
        "px-4",
        "mt-2"
      )}
    >
      {props.children}
    </div>
  );
};
