import type { Meta, StoryObj } from "@storybook/react";

import { BackText as Template } from "./";
import * as fixture from "../fixture";

const meta = {
  title: "Organism/BackText",
  component: Template,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    onClick: { action: "onClick" },
  },
  args: {
    text: "back text",
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Math: Story = {
  args: {
    text: fixture.math.block,
    category: "math",
  },
};

export const Python: Story = {
  args: {
    text: fixture.code.default,
    category: "python",
  },
};

export const LongText: Story = {
  args: {
    text: fixture.code.longtext,
  },
};
