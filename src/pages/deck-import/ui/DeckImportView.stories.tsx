import type { Meta, StoryObj } from "@storybook/react";

import { withPageLayout } from "@/storybook/PageLayoutDecorator";
import { getDeckImportExamples } from "../model/queries/getDeckImportExamples";
import { DeckImportView, type DeckImportViewProps } from "./DeckImportView";

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
  title: "Pages/Deck Import/DeckImportView",
  component: DeckImportView,
  tags: ["autodocs"],
  decorators: [withPageLayout],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    examples: getDeckImportExamples(),
  },
} satisfies Meta<typeof DeckImportView>;

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

export const PreviewError: Story = {
  args: { previewError: new Error("The selected CSV file could not be read.") },
};

export const Pending: Story = {
  args: {
    pending: true,
    preview,
  },
};

export const Validating: Story = { args: { validating: true } };
export const MathExample: Story = { args: { initialExampleId: "math" } };
export const MarkdownExample: Story = { args: { initialExampleId: "markdown" } };
export const SampleDeckExample: Story = { args: { initialExampleId: "deck" } };
export const DarkReview: Story = {
  args: { initialExampleId: "deck", dark: true },
  globals: { theme: "dark" },
};
export const IphoneReview: Story = {
  args: { initialExampleId: "deck" },
  globals: { viewport: { value: "iphonex", isRotated: false } },
};
