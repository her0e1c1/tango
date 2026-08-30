import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import { fn } from "storybook/test";

import { ScoreRange } from "./ScoreRange";

type ScoreRangeProps = React.ComponentProps<typeof ScoreRange>;

const InteractiveScoreRange: React.FC<ScoreRangeProps> = (props) => {
  const [maximum, setMaximum] = React.useState(props.maximum);
  const [minimum, setMinimum] = React.useState(props.minimum);

  return (
    <ScoreRange
      {...props}
      maximum={maximum}
      minimum={minimum}
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
  title: "Features/Deck Filter/ScoreRange",
  component: ScoreRange,
  tags: ["autodocs"],
  args: {
    maximum: 4,
    minimum: -2,
    onMaximumChange: fn(),
    onMinimumChange: fn(),
  },
  render: (args) => <InteractiveScoreRange {...args} />,
} satisfies Meta<typeof ScoreRange>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoLimits: Story = { args: { maximum: null, minimum: null } };

export const MinimumOnly: Story = { args: { maximum: null, minimum: -3 } };

export const MaximumOnly: Story = { args: { maximum: 5, minimum: null } };

export const SavedOutsideStandardRange: Story = { args: { maximum: 14.25, minimum: -12.5 } };

export const InvalidSavedRange: Story = { args: { maximum: 3, minimum: 5 } };

export const Mobile320: Story = {
  globals: { viewport: { value: "iphone5", isRotated: false } },
};

export const Mobile375: Story = {
  args: { maximum: 14.25, minimum: -12.5 },
  globals: { viewport: { value: "iphonex", isRotated: false } },
};

export const Dark: Story = {
  args: { maximum: 3, minimum: 5 },
  globals: { theme: "dark" },
};
