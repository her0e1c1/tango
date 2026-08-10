/**
 * @file Defines Storybook examples for Tag List.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */

import type { Meta, StoryObj } from "@storybook/react";

import { Tag } from "@/shared/ui/tag";
import { TagList as Template } from "@/shared/ui/tag";
import * as fixture from "@/app/storybook/fixture";

const meta = {
  title: "Shared/Content/TagList",
  component: Template,
  tags: ["autodocs"],
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: fixture.tags.default.map((t) => <Tag key={t} label={t} />),
  },
};

export const TooLong: Story = {
  args: {
    children: fixture.tags.toolong.map((t) => <Tag key={t} label={t} />),
  },
};

export const TooLongWithScroll: Story = {
  args: {
    hasManyItems: true,
    children: fixture.tags.toolong.map((t) => <Tag key={t} label={t} />),
  },
  parameters: { viewport: { defaultViewport: "iphone5" } },
};
