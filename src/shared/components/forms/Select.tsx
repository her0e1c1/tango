import cx from "classnames";
import type * as React from "react";

export interface Option {
  label: string;
  value: string;
}

export const Select: React.FC<{
  options?: Option[];
  empty?: boolean;
  className?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  inputRef?: React.Ref<HTMLSelectElement>;
}> = (props) => {
  let options = props.options;
  if (props.empty) {
    options = [{ label: "", value: "" }, ...(props.options ?? [])];
  }
  return (
    <select
      ref={props.inputRef}
      name={props.name}
      value={props.value}
      defaultValue={props.defaultValue}
      disabled={props.disabled}
      required={props.required}
      onChange={props.onChange}
      onBlur={props.onBlur}
      className={cx(
        "block min-h-touch w-full appearance-none rounded-control border border-border bg-surface px-4 py-2 pr-8 leading-tight text-ink shadow-surface transition-colors duration-fast ease-calm hover:border-ink-muted focus-visible:border-focus invalid:border-danger disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-muted",
        props.className
      )}
    >
      {options?.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
};
