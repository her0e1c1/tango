import type { Meta, StoryObj } from "@storybook/react";

import { Math as Template } from "./Math";
import * as fixture from "../fixture";

const meta = {
  title: "Atom/Math",
  component: Template,
  tags: ["autodocs"],
  args: {},
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Inline: Story = {
  args: {
    text: fixture.math.inline,
  },
};

export const Block: Story = {
  args: {
    text: fixture.math.block,
  },
};

export const Markdown: Story = {
  args: {
    text: fixture.math.markdown,
  },
};
