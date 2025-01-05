import type { Meta, StoryObj } from "@storybook/react";

import { Tag as Template } from "./Tag";

const meta = {
  title: "Atom/Tag",
  component: Template,
  tags: ["autodocs"],
  args: {
    label: "tag",
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = {
  args: { small: true },
};

export const Large: Story = {
  args: { large: true },
};

export const Round: Story = {
  args: { round: true },
};

export const RoundSmall: Story = {
  args: { round: true, small: true },
};

export const RoundLarge: Story = {
  args: { round: true, large: true },
};

export const Primary: Story = {
  args: { primary: true },
};

export const PrimarySmall: Story = {
  args: { primary: true, small: true },
};

export const PrimaryLarge: Story = {
  args: { primary: true, large: true },
};

export const Checked: Story = {
  args: { checked: true },
};

export const Clickable: Story = {
  args: { onChange: () => {} },
};

export const ClickableChecked: Story = {
  args: { onChange: () => {}, checked: true },
};

export const PrimaryChecked: Story = {
  args: { primary: true, checked: true },
};

export const PrimaryClickable: Story = {
  args: { primary: true, onChange: () => {} },
};

export const PrimaryClickableChecked: Story = {
  args: { primary: true, onChange: () => {}, checked: true },
};
