import type { Meta, StoryObj } from "@storybook/react";

import * as C from "@src/constant";
import { DeckImportTemplate as Template } from "@src/features/import/components/templates/DeckImportTemplate";
import { INITIAL_VIEWPORTS } from "@src/shared/storybook/storybookViewports";

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

export const Empty: Story = {
  args: {
    sampleText: "",
  },
};

export const IphoneX: Story = {
  parameters: {
    viewport: {
      defaultViewport: "iphonex",
    },
  },
};
