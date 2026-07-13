import cx from "classnames";
import * as React from "react";

export const Card: React.FC<{
  className?: string;
  full?: boolean;
  disabled?: boolean;
  border?: boolean;
  children?: React.ReactNode;
}> = (props) => {
  return (
    <div className={cx("flex", props.full ? "w-full" : ["w-full", "md:w-1/2", "lg:w-1/3"])}>
      <div
        className={cx(
          "flex-1 flex flex-col justify-between",
          "overflow-hidden",
          "rounded shadow",
          "dark:text-gray-300",
          !props.disabled ? ["bg-gray-100", "dark:bg-gray-700"] : ["bg-gray-50", "dark:bg-gray-500"],
          props.border && ["border", "dark:border-black"],
          props.className
        )}
      >
        {props.children}
      </div>
    </div>
  );
};
