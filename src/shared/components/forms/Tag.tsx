import cx from "classnames";
import * as React from "react";

export const Tag: React.FC<{
  className?: string;
  round?: boolean;
  small?: boolean;
  large?: boolean;
  label?: string;
  checked?: boolean;
  default?: boolean;
  primary?: boolean;
  hidden?: boolean;
  name?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  inputRef?: React.Ref<HTMLInputElement>;
  children?: React.ReactNode;
}> = (props) => {
  return (
    <label className={cx("inline-block", { hidden: props.hidden })}>
      <input
        readOnly
        type="checkbox"
        className="hidden peer"
        checked={props.checked}
        ref={props.inputRef}
        name={props.name}
        value={props.value}
        onChange={props.onChange}
        onBlur={props.onBlur}
      />
      <div
        className={cx(
          props.className,
          "select-none",
          "whitespace-nowrap",
          "font-medium",
          "align-middle",
          props.round ? "rounded-full" : "rounded",
          props.large ? ["py-3 px-4 text-lg"] : props.small ? ["py-1 px-1 text-xs"] : ["py-2 px-3 text-sm"],
          props.primary
            ? [
                "bg-blue-200",
                "text-blue-500",
                "peer-checked:bg-blue-300",
                "dark:bg-blue-700",
                "dark:text-blue-400",
                "dark:peer-checked:bg-blue-900",
              ]
            : [
                "bg-gray-200",
                "text-gray-500",
                "peer-checked:bg-gray-300",
                "dark:bg-gray-700",
                "dark:text-gray-400",
                "dark:peer-checked:bg-gray-900",
              ],
          props.onChange != null && "cursor-pointer"
        )}
      >
        {props.label ?? props.children}
      </div>
    </label>
  );
};
