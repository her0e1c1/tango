import type { Meta, StoryObj } from "@storybook/react";

import { CardOverlay as Template } from "@src/features/card/components/CardOverlay";
import * as fixture from "@src/shared/storybook/fixture";

const meta = {
  title: "Card/CardOverlay",
  component: Template,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    card: fixture.card.default,
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
