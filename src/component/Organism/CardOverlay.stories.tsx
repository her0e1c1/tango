import type { Meta, StoryObj } from "@storybook/react";

import { CardOverlay as Template } from "./";
import * as fixture from "../fixture";

const meta = {
  title: "Organism/CardOverlay",
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
