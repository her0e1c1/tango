import type { ComponentProps } from "react";

import { textControlClassName } from "./textControlStyles";

export interface Option {
  label: string;
  value: string;
}

type SelectProps = Omit<ComponentProps<"select">, "children"> & {
  options?: Option[];
  empty?: boolean;
};

export const Select = ({ options = [], empty, className, ...props }: SelectProps) => {
  const renderedOptions = empty ? [{ label: "", value: "" }, ...options] : options;

  return (
    <select {...props} className={textControlClassName("select", className)}>
      {renderedOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};
