import type { Meta, StoryObj } from "@storybook/react";

import { Layout as Template } from "./";

const meta = {
  title: "Organism/Layout",
  component: Template,
  tags: ["autodocs"],
  argTypes: {},
  args: {
    showHeader: true,
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
