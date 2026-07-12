import type { Meta, StoryObj } from "@storybook/react";

import { INITIAL_VIEWPORTS } from "@src/shared/storybook/storybookViewports";
import { ConfigForm as Template } from "@src/component/Template";
import * as fixture from "@src/shared/storybook/fixture";

const meta = {
  title: "Template/ConfigForm",
  component: Template,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    viewport: {
      viewports: INITIAL_VIEWPORTS,
      defaultViewport: "desktop",
    },
  },
  args: {
    configForm: {
      config: fixture.config.default,
      version: "1.2.3",
    },
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongUserName: Story = {
  args: {
    configForm: {
      isLoggedIn: true,
      config: fixture.config.longUserName,
    },
  },
};

export const IphoneX: Story = {
  parameters: {
    viewport: {
      defaultViewport: "iphonex",
    },
  },
};
