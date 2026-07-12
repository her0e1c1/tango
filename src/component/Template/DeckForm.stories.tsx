import type { Meta, StoryObj } from "@storybook/react";

import { INITIAL_VIEWPORTS } from "@src/component/storybookViewports";
import { DeckForm as Template } from "@src/component/Template";
import * as fixture from "@src/component/fixture";

const meta = {
  title: "Template/DeckForm",
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
    deckForm: {
      deck: fixture.deck.default,
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
