import type { Meta, StoryObj } from "@storybook/react";

import { ConfigForm as Template } from "@src/component/Organism";
import * as fixture from "@src/shared/storybook/fixture";

const meta = {
  title: "Organism/ConfigForm",
  component: Template,
  tags: ["autodocs"],
  argTypes: {
    onSubmit: { action: "onSubmit" },
    onLogin: { action: "onLogin" },
    onLogout: { action: "onLogout" },
  },
  args: {
    config: fixture.config.default,
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Logout: Story = {
  args: { isLoggedIn: true },
};
