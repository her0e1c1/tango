/**
 * @file Defines Storybook examples for Tag List.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */

import type { Meta, StoryObj } from "@storybook/react";

import { Tag } from "@/shared/ui/forms";
import { TagList as Template } from "@/shared/ui/content/TagList";
import { tags } from "@/storybook/fixture";

const meta = {
  title: "Shared/Content/TagList",
  component: Template,
  tags: ["autodocs"],
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: tags.default.map((t) => <Tag key={t} label={t} />),
  },
};

export const TooLong: Story = {
  args: {
    children: tags.toolong.map((t) => <Tag key={t} label={t} />),
  },
};

export const TooLongWithScroll: Story = {
  args: {
    hasManyItems: true,
    children: tags.toolong.map((t) => <Tag key={t} label={t} />),
  },
  parameters: { viewport: { defaultViewport: "iphone5" } },
};
