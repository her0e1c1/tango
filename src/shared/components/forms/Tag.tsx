import cx from "classnames";
import type * as React from "react";

export const Tag: React.FC<{
  className?: string;
  round?: boolean;
  small?: boolean;
  large?: boolean;
  label?: string;
  checked?: boolean;
  disabled?: boolean;
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
        disabled={props.disabled}
        ref={props.inputRef}
        name={props.name}
        value={props.value}
        onChange={props.onChange}
        onBlur={props.onBlur}
      />
      <div
        className={cx(
          props.className,
          "inline-flex min-h-touch min-w-touch select-none items-center justify-center",
          "whitespace-nowrap",
          "font-medium",
          "align-middle",
          "border border-border transition-colors duration-fast ease-calm peer-checked:ring-2 peer-checked:ring-current",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
          props.round ? "rounded-pill" : "rounded-control",
          props.large ? ["py-3 px-4 text-lg"] : props.small ? ["py-1 px-1 text-xs"] : ["py-2 px-3 text-sm"],
          props.primary
            ? ["bg-accent-primary text-ink-inverse", "peer-checked:border-accent-primary"]
            : [
                "bg-surface-muted text-ink",
                "peer-checked:border-accent-secondary peer-checked:bg-accent-secondary peer-checked:text-ink-inverse",
              ],
          props.onChange != null && !props.disabled && "cursor-pointer"
        )}
      >
        {props.label ?? props.children}
      </div>
    </label>
  );
};
