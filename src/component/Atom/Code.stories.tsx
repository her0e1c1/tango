import type { Meta, StoryObj } from "@storybook/react";

import { Code as Template } from "./Code";
import * as fixture from "../fixture";

const meta = {
  title: "Atom/Code",
  component: Template,
  tags: ["autodocs"],
  args: {
    text: fixture.code.default,
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Python: Story = {
  args: { category: "python" },
};
