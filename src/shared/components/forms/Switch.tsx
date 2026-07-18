import cx from "classnames";
import type * as React from "react";

export const Switch: React.FC<{
  id?: string;
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
  "aria-label"?: string;
  "aria-describedby"?: string;
}> = ({
  id,
  className,
  small,
  large,
  checked,
  disabled,
  name,
  value,
  onChange,
  onBlur,
  inputRef,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
}) => {
  return (
    <label className={cx("inline-flex min-h-touch min-w-touch items-center justify-center", className)}>
      <input
        ref={inputRef}
        id={id}
        name={name}
        checked={checked}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        type="checkbox"
        className="hidden peer"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
      />
      <span
        className={cx(
          "flex shrink-0 items-center rounded-pill border border-border bg-surface-muted p-1",
          "transition-colors duration-normal ease-calm",
          "peer-checked:border-accent-secondary peer-checked:bg-accent-secondary",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
          small
            ? ["w-8 h-5", "after:w-4 after:h-4", "peer-checked:after:translate-x-2"]
            : large
              ? ["w-16 h-10", "after:w-8 after:h-8", "peer-checked:after:translate-x-6"]
              : ["w-10 h-6", "after:w-5 after:h-5", "peer-checked:after:translate-x-3"],
          "after:rounded-full after:bg-surface-elevated after:shadow-surface",
          "after:transition-transform after:duration-normal after:ease-calm"
        )}
      ></span>
    </label>
  );
};
