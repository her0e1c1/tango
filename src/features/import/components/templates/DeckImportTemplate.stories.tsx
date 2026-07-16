import type { Meta, StoryObj } from "@storybook/react";

import * as C from "@/constant";
import { DeckImportTemplate as Template } from "@/features/import/components/templates/DeckImportTemplate";
import { INITIAL_VIEWPORTS } from "@/shared/storybook/storybookViewports";

const meta = {
  title: "Import/DeckImportTemplate",
  component: Template,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    viewport: {
      viewports: INITIAL_VIEWPORTS,
      defaultViewport: "desktop",
    },
  },
  args: {
    sampleText: C.CSV_SAMPLE_TEXT,
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Pending: Story = {
  args: {
    pending: true,
  },
};

export const LongSample: Story = {
  args: {
    sampleText: Array.from(
      { length: 12 },
      (_, index) => `A long front ${index + 1},A long back ${index + 1},tag-${index + 1}`
    ).join("\n"),
  },
};

export const DarkReview: Story = {
  ...LongSample,
  globals: { theme: "dark" },
};

export const IphoneReview: Story = {
  ...LongSample,
  parameters: {
    viewport: {
      defaultViewport: "iphonex",
    },
  },
};
