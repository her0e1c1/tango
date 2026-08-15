import React from "react";

import { Slider } from "./Slider";

export const InteractiveSlider: React.FC<React.ComponentProps<typeof Slider>> = (props) => {
  const [value, setValue] = React.useState(props.value ?? "40");

  return (
    <Slider
      {...props}
      value={value}
      onChange={(event) => {
        props.onChange?.(event);
        setValue(event.target.value);
      }}
    />
  );
};
