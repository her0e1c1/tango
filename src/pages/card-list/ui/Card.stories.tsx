import type { Meta, StoryObj } from "@storybook/react";

import { DifficultyIndicator } from "@/entities/study-progress";
import { withPageLayout } from "@/storybook/PageLayoutDecorator";
import { Card } from "./Card";
import * as fixture from "@/storybook/fixture";

const meta = {
  title: "Pages/Card List/Card",
  component: Card,
  tags: ["autodocs"],
  decorators: [withPageLayout],
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <div className="overflow-visible rounded-surface border border-border bg-surface shadow-surface dark:border-black">
      <Card {...args} />
    </div>
  ),
  args: {
    card: fixture.card.default,
    difficultySlot: <DifficultyIndicator difficulty={fixture.card.default.difficulty} />,
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Unstudied: Story = {
  args: { card: { ...fixture.card.default, numberOfSeen: 0, difficulty: 5 } },
};

export const LongText: Story = { args: { card: fixture.card.long } };
export const LongTags: Story = { args: { card: fixture.card.longTags } };
export const ActionsOpen: Story = { args: { menuOpen: true } };
export const Pending: Story = { args: { disabled: true } };
export const Mobile: Story = { globals: { viewport: { value: "iphonex", isRotated: false } } };
export const Dark: Story = { globals: { theme: "dark" } };
