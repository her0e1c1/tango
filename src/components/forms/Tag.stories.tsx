import type { Meta, StoryObj } from "@storybook/react";

import { Tag as Template } from "@/components/forms/Tag";

const meta = {
  title: "Shared/Forms/Tag",
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

export const Disabled: Story = {
  args: { checked: true, disabled: true, label: "disabled tag" },
};

export const Clickable: Story = {
  args: {
    onChange: () => {
      /* intentional no-op */
    },
  },
};

export const ClickableChecked: Story = {
  args: {
    onChange: () => {
      /* intentional no-op */
    },
    checked: true,
  },
};

export const PrimaryChecked: Story = {
  args: { primary: true, checked: true },
};

export const PrimaryClickable: Story = {
  args: {
    primary: true,
    onChange: () => {
      /* intentional no-op */
    },
  },
};

export const PrimaryClickableChecked: Story = {
  args: {
    primary: true,
    onChange: () => {
      /* intentional no-op */
    },
    checked: true,
  },
};

export const LightAndDark: Story = {
  render: () => (
    <div className="grid gap-4">
      <div className="flex gap-3 bg-canvas p-4 text-ink">
        <Template label="Light" />
        <Template checked primary label="Selected" />
      </div>
      <div className="dark flex gap-3 bg-canvas p-4 text-ink">
        <Template label="Dark" />
        <Template checked primary label="Selected" />
      </div>
    </div>
  ),
};

export const NarrowViewport: Story = {
  args: { checked: true, label: "Selected on mobile", round: true },
  parameters: { viewport: { defaultViewport: "iphone5" } },
};
