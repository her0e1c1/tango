import cx from "classnames";
import type * as React from "react";

export const Switch: React.FC<{
  className?: string;
  small?: boolean;
  large?: boolean;
  checked?: boolean;
  disabled?: boolean;
  name?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  inputRef?: React.Ref<HTMLInputElement>;
}> = (props) => {
  return (
    <label className={cx("inline-block", props.className)}>
      <input
        ref={props.inputRef}
        name={props.name}
        checked={props.checked}
        value={props.value}
        onChange={props.onChange}
        onBlur={props.onBlur}
        type="checkbox"
        className="hidden peer"
        disabled={props.disabled}
      />
      <span
        className={cx(
          "flex shrink-0 items-center rounded-pill border border-border bg-surface-muted p-1",
          "transition-colors duration-normal ease-calm",
          "peer-checked:border-accent-secondary peer-checked:bg-accent-secondary",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
          props.small
            ? ["w-8 h-5", "after:w-4 after:h-4", "peer-checked:after:translate-x-2"]
            : props.large
              ? ["w-16 h-10", "after:w-8 after:h-8", "peer-checked:after:translate-x-6"]
              : ["w-10 h-6", "after:w-5 after:h-5", "peer-checked:after:translate-x-3"],
          "after:rounded-full after:bg-surface-elevated after:shadow-surface",
          "after:transition-transform after:duration-normal after:ease-calm"
        )}
      ></span>
    </label>
  );
};
