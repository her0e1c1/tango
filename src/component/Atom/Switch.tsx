import cx from "classnames";
import * as React from "react";

export const Switch: React.FC<{
  className?: string;
  small?: boolean;
  large?: boolean;
  checked?: boolean;
  name?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  inputRef?: React.Ref<HTMLInputElement>;
}> = (props) => {
  return (
    <label className={cx("inline-block")}>
      <input
        ref={props.inputRef}
        name={props.name}
        checked={props.checked}
        value={props.value}
        onChange={props.onChange}
        onBlur={props.onBlur}
        type="checkbox"
        className="hidden peer"
      />
      <span
        className={cx(
          "flex items-center flex-shrink-0 p-1 rounded-full",
          "duration-300",
          "ease-in-out",
          "bg-gray-300",
          "peer-checked:bg-green-400",
          props.small
            ? ["w-8 h-5", "after:w-4 after:h-4", "peer-checked:after:translate-x-2"]
            : props.large
              ? ["w-16 h-10", "after:w-8 after:h-8", "peer-checked:after:translate-x-6"]
              : ["w-10 h-6", "after:w-5 after:h-5", "peer-checked:after:translate-x-3"],
          "after:bg-white after:rounded-full after:shadow-md",
          "after:duration-300"
        )}
      ></span>
    </label>
  );
};
