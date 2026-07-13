import type { Meta, StoryObj } from "@storybook/react";

import { Select as Template } from "@src/shared/components/forms/Select";
import * as fixture from "@src/shared/storybook/fixture";

const meta = {
  title: "Shared/Select",
  component: Template,
  tags: ["autodocs"],
  args: {
    options: fixture.form.options.default,
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { empty: true },
};
