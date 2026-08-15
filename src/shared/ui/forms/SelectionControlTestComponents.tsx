import { useId } from "react";

import { Slider } from "./Slider";
import { Switch } from "./Switch";

export const UniqueSwitch = () => {
  const inputId = useId();
  const descriptionId = useId();
  return (
    <>
      <Switch id={inputId} aria-label="Dark mode" aria-describedby={descriptionId} />
      <span id={descriptionId}>Switch description</span>
    </>
  );
};

export const UniqueSlider = () => {
  const inputId = useId();
  const descriptionId = useId();
  return (
    <>
      <Slider
        id={inputId}
        aria-label="Autoplay interval"
        aria-describedby={descriptionId}
        aria-valuetext="7 seconds"
        min={0}
        max={60}
        value="7"
        onChange={() => undefined}
      />
      <span id={descriptionId}>Slider description</span>
    </>
  );
};
