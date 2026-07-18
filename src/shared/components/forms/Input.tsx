import type * as React from "react";
import cx from "classnames";

export const Input: React.FC<{
  className?: string;
  name?: string;
  type?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  ref?: React.Ref<HTMLInputElement>;
}> = ({
  className,
  name,
  type,
  value,
  defaultValue,
  disabled,
  readOnly,
  required,
  placeholder,
  onChange,
  onBlur,
  ref,
}) => {
  return (
    <input
      ref={ref}
      type={type}
      name={name}
      defaultValue={defaultValue}
      value={value}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      placeholder={placeholder}
      onChange={onChange}
      onBlur={onBlur}
      className={cx(
        "min-h-touch w-full appearance-none rounded-control border border-border bg-surface px-3 py-2 leading-tight text-ink shadow-surface transition-colors duration-fast ease-calm placeholder:text-ink-muted hover:border-ink-muted focus-visible:border-focus invalid:border-danger disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-muted read-only:bg-surface-muted",
        className
      )}
    />
  );
};
