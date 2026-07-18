import cx from "classnames";
import type * as React from "react";

import { tagClassName } from "@/components/content/tagStyles";

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
  ref?: React.Ref<HTMLInputElement>;
  children?: React.ReactNode;
}> = ({ className, small, large, label, checked, disabled, hidden, name, value, onChange, onBlur, ref, children }) => {
  return (
    <label className={cx("inline-block", { hidden })}>
      <input
        readOnly
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        ref={ref}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
      />
      <span
        className={cx(
          tagClassName({
            interactive: onChange != null && !disabled,
            ...(className !== undefined ? { className } : {}),
          }),
          "select-none justify-center whitespace-nowrap align-middle",
          "before:mr-2 before:size-2 before:shrink-0 before:rounded-pill before:bg-ink-muted before:content-['']",
          "peer-checked:border-accent-primary peer-checked:bg-accent-primary/10 peer-checked:text-accent-primary",
          "peer-checked:before:bg-accent-primary peer-checked:before:ring-2 peer-checked:before:ring-accent-primary/20",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-focus",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
          large ? "px-4 text-lg" : small ? "px-2 text-xs" : undefined
        )}
      >
        <span className="min-w-0 truncate">{label ?? children}</span>
      </span>
    </label>
  );
};
