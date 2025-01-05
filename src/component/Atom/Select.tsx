import cx from "classnames";
import * as React from "react";

export const Select: React.FC<{
  options?: Option[];
  empty?: boolean;
  name?: string;
  value?: string;
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
      onChange={props.onChange}
      onBlur={props.onBlur}
      className={cx(
        `block appearance-none w-full bg-white border border-gray-400
        hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight
        focus:outline-none focus:shadow-outline`
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
