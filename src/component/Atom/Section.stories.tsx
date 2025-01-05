import type { Meta, StoryObj } from "@storybook/react";

import { Section as Template } from "./Section";

const meta = {
  title: "Atom/Section",
  component: Template,
  tags: ["autodocs"],
  args: {
    title: "this is a section",
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
