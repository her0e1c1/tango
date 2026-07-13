import cx from "classnames";
import * as React from "react";

export const Button: React.FC<{
  label?: string;
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  hidden?: boolean;
  small?: boolean;
  large?: boolean;
  default?: boolean;
  primary?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
}> = (props) => {
  return (
    <button
      type={props.type ?? "button"}
      className={cx(
        "text-white rounded disabled:cursor-not-allowed",
        { hidden: props.hidden },
        {
          "px-4 py-2 font-bold text-ml": !props.small && !props.large,
          "px-2 py-1 font-semibold text-sm": props.small,
          "px-6 py-3 font-bold text-lg": props.large,
          "bg-gray-500 hover:bg-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600": !props.primary,
          "dark:border dark:border-gray-900": !props.primary,
          "bg-blue-500 hover:bg-blue-600 dark:bg-blue-700 dark:text-gray-100 dark:hover:bg-blue-600 ": props.primary,
          "disabled:bg-gray-300 disabled:hover:bg-gray-300 disabled:dark:bg-gray-800 disabled:dark:hover:bg-gray-800":
            !props.primary,
          "disabled:bg-blue-300 disabled:hover:bg-blue-300 disabled:dark:bg-blue-800 disabled:dark:hover:bg-blue-800":
            props.primary,
        },
        props.className
      )}
      disabled={props.disabled}
      onClick={!props.disabled ? props.onClick : undefined}
    >
      {props.label ?? props.children}
    </button>
  );
};
