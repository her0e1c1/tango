import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import { fn } from "storybook/test";

import { DifficultyRange } from "./DifficultyRange";

type DifficultyRangeProps = React.ComponentProps<typeof DifficultyRange>;

const InteractiveDifficultyRange: React.FC<DifficultyRangeProps> = (props) => {
  const [maximum, setMaximum] = React.useState(props.maximum);
  const [minimum, setMinimum] = React.useState(props.minimum);

  return (
    <DifficultyRange
      {...props}
      maximum={maximum}
      minimum={minimum}
      onClear={() => {
        props.onClear();
        setMaximum(null);
        setMinimum(null);
      }}
      onMaximumChange={(value) => {
        props.onMaximumChange(value);
        setMaximum(value);
      }}
      onMinimumChange={(value) => {
        props.onMinimumChange(value);
        setMinimum(value);
      }}
    />
  );
};

const meta = {
  title: "Features/Deck Filter/DifficultyRange",
  component: DifficultyRange,
  tags: ["autodocs"],
  args: {
    lowerBound: 1,
    maximum: 8,
    minimum: 3,
    onClear: fn(),
    onMaximumChange: fn(),
    onMinimumChange: fn(),
    upperBound: 10,
  },
  render: (args) => <InteractiveDifficultyRange {...args} />,
} satisfies Meta<typeof DifficultyRange>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoLimits: Story = { args: { maximum: null, minimum: null } };

export const MinimumOnly: Story = { args: { maximum: null, minimum: 3 } };

export const MaximumOnly: Story = { args: { maximum: 5, minimum: null } };

export const SavedFractionalRange: Story = { args: { maximum: 8.25, minimum: 2.5 } };

export const InvalidSavedRange: Story = { args: { maximum: 3, minimum: 5 } };

export const Mobile320: Story = {
  globals: { viewport: { value: "iphone5", isRotated: false } },
};

export const Mobile375: Story = {
  args: { maximum: 8.25, minimum: 2.5 },
  globals: { viewport: { value: "iphonex", isRotated: false } },
};

export const Dark: Story = {
  args: { maximum: 3, minimum: 5 },
  globals: { theme: "dark" },
};
