import React from "react";

import type { Meta, StoryObj } from "@storybook/react";

import { TagList as Template } from "@src/component/Molecule/TagList";
import { Tag } from "@src/component/Atom";
import * as fixture from "@src/component/fixture";

const meta = {
  title: "Molecule/TagList",
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
