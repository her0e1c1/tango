import React from "react";

import type { Meta, StoryObj } from "@storybook/react";

import { Tag } from "@src/shared/components/Tag";
import { TagList as Template } from "@src/shared/components/TagList";
import * as fixture from "@src/shared/storybook/fixture";

const meta = {
  title: "Shared/TagList",
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
    children: fixture.tags.toolong.map((t) => <Tag key={t} label={t} />),
  },
};
