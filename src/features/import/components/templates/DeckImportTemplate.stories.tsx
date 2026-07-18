import type { Meta, StoryObj } from "@storybook/react";

import * as C from "@/constant";
import { DeckImportTemplate as Template } from "@/features/import/components/templates/DeckImportTemplate";
import type { DeckImportPreview } from "@/features/import/components/deckImportTypes";
import { INITIAL_VIEWPORTS } from "@/storybook/storybookViewports";

const preview = {
  fileName: "spanish-basics.csv",
  deckName: "spanish-basics.csv",
  analysis: {
    rows: [
      {
        rowNumber: 1,
        card: { frontText: "hello", backText: "hola", tags: ["greeting"], uniqueKey: "hello-es" },
      },
      {
        rowNumber: 2,
        card: { frontText: "goodbye", backText: "adiós", tags: ["greeting"], uniqueKey: "goodbye-es" },
      },
    ],
    skippedRows: [3],
    issues: [],
    invalidCount: 0,
  },
  plan: {
    rows: [
      {
        rowNumber: 1,
        card: { frontText: "hello", backText: "hola", tags: ["greeting"], uniqueKey: "hello-es" },
        action: "update",
      },
      {
        rowNumber: 2,
        card: { frontText: "goodbye", backText: "adiós", tags: ["greeting"], uniqueKey: "goodbye-es" },
        action: "create",
      },
    ],
    created: 1,
    updated: 1,
    unchanged: 0,
  },
} satisfies DeckImportPreview;

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

export const Preview: Story = {
  args: { preview },
};

export const Invalid: Story = {
  args: {
    preview: {
      ...preview,
      analysis: {
        rows: [],
        skippedRows: [],
        invalidCount: 1,
        issues: [
          {
            rowNumber: 2,
            message: "Expected 4 columns, found 3.",
            context: '["goodbye","adiós","greeting"]',
          },
        ],
      },
      plan: { rows: [], created: 0, updated: 0, unchanged: 0 },
    },
  },
};

export const Pending: Story = {
  args: {
    pending: true,
    preview,
  },
};

export const Success: Story = {
  args: {
    preview,
    result: { created: 1, updated: 1, skipped: 0, failed: 0, deckId: "spanish-basics" },
  },
};

export const PartialFailure: Story = {
  args: {
    preview,
    error: new Error("1 Card write failed"),
    partialResult: { created: 1, updated: 0, skipped: 0, failed: 1, deckId: "spanish-basics" },
  },
};

export const LongSample: Story = {
  args: {
    sampleText: Array.from(
      { length: 12 },
      (_, index) => `A long front ${index + 1},A long back ${index + 1},tag-${index + 1},sample-${index + 1}`
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
