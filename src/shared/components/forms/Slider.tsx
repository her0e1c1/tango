import type React from "react";

export const Slider: React.FC<{
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  name?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  inputRef?: React.Ref<HTMLInputElement>;
}> = (props) => {
  return (
    <input
      type="range"
      min={props.min}
      max={props.max}
      step={props.step ?? 1}
      disabled={props.disabled}
      ref={props.inputRef}
      name={props.name}
      value={props.value}
      onChange={props.onChange}
      onBlur={props.onBlur}
      className="h-2 w-full appearance-none rounded-pill bg-surface-muted accent-accent-primary transition-opacity duration-fast ease-calm disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
};
