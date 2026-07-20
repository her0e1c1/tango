/**
 * @file Defines Storybook examples for Upload.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */

import type { Meta, StoryObj } from "@storybook/react";

import { Upload as Template } from "@/components/forms/Upload";

const meta = {
  title: "Shared/Forms/Upload",
  component: Template,
  tags: ["autodocs"],
  argTypes: {
    onChange: { action: "onChange" },
  },
  args: {},
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FileChosen: Story = {
  args: { fileName: "biology-cards.csv" },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const LightAndDark: Story = {
  render: () => (
    <div className="grid gap-4">
      <div className="bg-canvas p-4">
        <Template fileName="light-cards.csv" />
      </div>
      <div className="dark bg-canvas p-4">
        <Template fileName="dark-cards.csv" />
      </div>
    </div>
  ),
};

export const NarrowViewport: Story = {
  args: { fileName: "a-long-file-name-on-a-narrow-mobile-viewport.csv" },
  parameters: { viewport: { defaultViewport: "iphone5" } },
};
