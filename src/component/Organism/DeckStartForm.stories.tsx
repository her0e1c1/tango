import type { Meta, StoryObj } from "@storybook/react";

import { DeckStartForm as Template } from "@src/component/Organism";
import * as fixture from "@src/component/fixture";

const meta = {
  title: "Organism/DeckStartForm",
  component: Template,
  tags: ["autodocs"],
  argTypes: {
    onSubmit: { action: "onSubmit" },
  },
  args: {
    deck: fixture.deck.default,
    tags: fixture.tags.default,
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
