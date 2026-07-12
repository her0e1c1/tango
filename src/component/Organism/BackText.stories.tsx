import type { Meta, StoryObj } from "@storybook/react";

import { BackText as Template } from "@src/component/Organism";
import * as fixture from "@src/shared/storybook/fixture";

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

export const Golang: Story = {
  args: {
    text: fixture.code.default,
    category: "golang",
  },
};
export const LongText: Story = {
  args: {
    text: fixture.code.longtext,
  },
};
