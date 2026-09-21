import { expect } from "storybook/test";
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

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("radio")).not.toBeInTheDocument();
    await expect(canvas.getByRole("heading", { name: "Add a deck" })).toBeVisible();
  },
};

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
            diagnostic: { kind: "columns", count: 3 },
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

export const JapaneseDiagnostics: Story = {
  ...Invalid,
  parameters: { locale: "ja" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("alert")).toHaveTextContent("列数は4列である必要があります（現在は3列）。");
    await expect(canvas.getByRole("button", { name: /^0枚のカードを追加$/ })).toBeDisabled();
    await expect(document.documentElement).toHaveAttribute("lang", "ja");
  },
};
