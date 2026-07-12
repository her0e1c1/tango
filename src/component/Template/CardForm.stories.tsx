import type { Meta, StoryObj } from "@storybook/react";

import { INITIAL_VIEWPORTS } from "@src/shared/storybook/storybookViewports";
import { CardForm as Template } from "@src/component/Template";
import * as fixture from "@src/shared/storybook/fixture";

const meta = {
  title: "Template/CardForm",
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
    cardForm: {
      card: fixture.card.default,
      categoryOptions: fixture.form.options.default,
    },
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const IphoneX: Story = {
  parameters: {
    viewport: {
      defaultViewport: "iphonex",
    },
  },
};
