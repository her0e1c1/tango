import type { Meta, StoryObj } from "@storybook/react";

import * as fixture from "@/storybook/fixture";

import { Tag } from "../forms";
import { TagList } from "./TagList";

const meta = {
  title: "Shared/Content/TagList",
  component: TagList,
  tags: ["autodocs"],
} satisfies Meta<typeof TagList>;

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
  globals: { viewport: { value: "iphone5", isRotated: false } },
};
