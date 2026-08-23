import type { Meta, StoryObj } from "@storybook/react";

import { INITIAL_VIEWPORTS } from "@/storybook/storybookViewports";

import { SAMPLE_CSV_TEXT } from "../lib/sampleCsv";
import { DeckImportView as Template, type DeckImportViewProps } from "./DeckImportView";

type DeckImportPreview = NonNullable<DeckImportViewProps["preview"]>;

const preview = {
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
} satisfies DeckImportPreview;

const meta = {
  title: "Features/Deck Import/DeckImportView",
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
    sampleText: SAMPLE_CSV_TEXT,
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
    result: { created: 2 },
  },
};

export const Failure: Story = {
  args: {
    preview,
    error: new Error("Card writes failed"),
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
