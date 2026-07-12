import type { Meta, StoryObj } from "@storybook/react";

import { Code as Template } from "@src/shared/components/Code";
import * as fixture from "@src/shared/storybook/fixture";

const meta = {
  title: "Shared/Code",
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
