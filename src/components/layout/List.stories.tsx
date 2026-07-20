/**
 * @file Defines Storybook examples for List.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */

import type { Meta, StoryObj } from "@storybook/react";

import { Card } from "@/components/content/Card";
import { List as Template } from "@/components/layout/List";

const meta = {
  title: "Shared/Layout/List",
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
  globals: {
    theme: "light",
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

export const MobileDarkLongText: Story = {
  args: {
    children: [1, 2, 3, 4, 5].map((i) => (
      <Card key={i} full>
        A longer card demonstrates the single-column mobile layout with semantic surfaces and readable spacing.
      </Card>
    )),
  },
  globals: {
    theme: "dark",
    viewport: { value: "iphonex", isRotated: false },
  },
};
