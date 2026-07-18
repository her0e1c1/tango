import type React from "react";

export const Slider: React.FC<{
  id?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  name?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  inputRef?: React.Ref<HTMLInputElement>;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-valuetext"?: string;
}> = ({
  id,
  min,
  max,
  step,
  disabled,
  name,
  value,
  onChange,
  onBlur,
  inputRef,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  "aria-valuetext": ariaValueText,
}) => {
  return (
    <div className="relative min-h-touch w-full">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 h-2 w-full -translate-y-1/2 rounded-pill bg-surface-muted"
      />
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step ?? 1}
        disabled={disabled}
        ref={inputRef}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-valuetext={ariaValueText}
        className="absolute inset-0 min-h-touch w-full appearance-none bg-transparent accent-accent-primary transition-opacity duration-fast ease-calm disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
};
