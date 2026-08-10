/**
 * @file Defines Storybook examples for Card.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */

import type { Meta, StoryObj } from "@storybook/react";

import { Card as Template } from "@/components/content/Card";

const defaultContent = (
  <>
    <div className="space-y-1">
      <p className="text-caption font-bold uppercase tracking-wider text-accent-primary">Study deck</p>
      <h2 className="text-title font-bold text-ink">TypeScript essentials</h2>
    </div>
    <p className="text-body text-ink-muted">Twelve focused cards for a calm, consistent review session.</p>
  </>
);

const meta = {
  title: "Shared/Content/Card",
  component: Template,
  tags: ["autodocs"],
  args: {
    children: defaultContent,
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Short: Story = {
  args: { children: "A compact card for a short note." },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Full: Story = {
  args: { full: true },
};

export const Border: Story = {
  args: { border: true },
};

export const TooLong: Story = {
  args: {
    children: "Long content remains readable and wraps naturally without escaping the card surface. ".repeat(12),
  },
  parameters: { viewport: { defaultViewport: "iphone5" } },
};

export const Dark: Story = {
  args: { border: true },
  globals: { theme: "dark" },
};
