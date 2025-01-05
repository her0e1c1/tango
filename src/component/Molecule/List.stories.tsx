import React from "react";

import type { Meta, StoryObj } from "@storybook/react";

import { List as Template, Card } from "./";

const meta = {
  title: "Molecule/List",
  component: Template,
  tags: ["autodocs"],
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OneColumn: Story = {
  args: {
    col1: true,
    children: [1, 2, 3, 4, 5, 6, 7].map((i) => (
      <Card key={i} full>
        {"this is a long text".repeat(10)}
      </Card>
    )),
  },
};

export const ResponsiveThreeColumn: Story = {
  args: {
    children: [1, 2, 3, 4, 5, 6, 7].map((i) => (
      <Card key={i} full>
        {"text"}
      </Card>
    )),
  },
};

export const ResponsiveThreeColumnWithLongText: Story = {
  args: {
    children: [1, 2, 3, 4, 5, 6, 7].map((i) => (
      <Card key={i} full>
        {"this is a long text".repeat(10)}
      </Card>
    )),
  },
};
