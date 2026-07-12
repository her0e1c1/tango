import type { Meta, StoryObj } from "@storybook/react";

import { Header as Template } from "@src/component/Organism";

const meta = {
  title: "Organism/Header",
  component: Template,
  tags: ["autodocs"],
  argTypes: {},
  args: {},
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
