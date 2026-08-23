import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";

import { Upload } from "./Upload";

const meta = {
  title: "Shared/Forms/Upload",
  component: Upload,
  tags: ["autodocs"],
  args: { onChange: fn() },
} satisfies Meta<typeof Upload>;

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
        <Upload fileName="light-cards.csv" />
      </div>
      <div className="dark bg-canvas p-4">
        <Upload fileName="dark-cards.csv" />
      </div>
    </div>
  ),
};

export const NarrowViewport: Story = {
  args: { fileName: "a-long-file-name-on-a-narrow-mobile-viewport.csv" },
  globals: { viewport: { value: "iphone5", isRotated: false } },
};
