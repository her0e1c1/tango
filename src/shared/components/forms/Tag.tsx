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
}> = ({
  className,
  round,
  small,
  large,
  label,
  checked,
  disabled,
  primary,
  hidden,
  name,
  value,
  onChange,
  onBlur,
  inputRef,
  children,
}) => {
  return (
    <label className={cx("inline-block", { hidden })}>
      <input
        readOnly
        type="checkbox"
        className="hidden peer"
        checked={checked}
        disabled={disabled}
        ref={inputRef}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
      />
      <div
        className={cx(
          className,
          "inline-flex min-h-touch min-w-touch select-none items-center justify-center",
          "whitespace-nowrap",
          "font-medium",
          "align-middle",
          "border border-border transition-colors duration-fast ease-calm peer-checked:ring-2 peer-checked:ring-current",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
          round ? "rounded-pill" : "rounded-control",
          large ? ["py-3 px-4 text-lg"] : small ? ["py-1 px-1 text-xs"] : ["py-2 px-3 text-sm"],
          primary
            ? ["bg-accent-primary text-ink-inverse", "peer-checked:border-accent-primary"]
            : [
                "bg-surface-muted text-ink",
                "peer-checked:border-accent-secondary peer-checked:bg-accent-secondary peer-checked:text-ink-inverse",
              ],
          onChange != null && !disabled && "cursor-pointer"
        )}
      >
        {label ?? children}
      </div>
    </label>
  );
};
