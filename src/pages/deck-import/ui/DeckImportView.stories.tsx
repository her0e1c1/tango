import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ImportFailure } from "../lib/importFailure";
import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

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
};

export const FormatDisclosure: Story = {};

export const PendingSelection: Story = {
  args: { pending: true },
};

export const ExampleRequests: Story = {
  args: { onSelectExample: fn(), onDownloadExample: fn() },
};

const singlePreview: DeckImportPreview = {
  deckName: "deck.csv",
  analysis: {
    rows: [{ rowNumber: 1, card: { frontText: "front", backText: "back", uniqueKey: "key-1", tags: [] } }],
    skippedRows: [2],
    issues: [],
    invalidCount: 0,
  },
};

export const ExplicitConfirmation: Story = {
  args: { preview: singlePreview, onChooseAgain: fn(), onImport: fn() },
};

export const PartlyInvalid: Story = {
  args: {
    preview: {
      ...singlePreview,
      analysis: {
        ...singlePreview.analysis,
        invalidCount: 1,
        issues: [{ rowNumber: 3, diagnostic: { kind: "card", field: "uniqueKey", reason: "required" } }],
      },
    },
  },
};

export const SafePreviewFailure: Story = {
  args: { previewError: new Error("file read failed") },
};

function LocalizedImport(args: DeckImportViewProps) {
  const { i18n } = useTranslation();
  return (
    <>
      <button type="button" onClick={() => void i18n.changeLanguage("ja")}>
        Japanese
      </button>
      <DeckImportView {...args} />
    </>
  );
}
function previewFailureStory(error: unknown): Story {
  return {
    args: { previewError: error },
    render: (args) => <LocalizedImport {...args} />,
  };
}
export const AuthenticationFailure = previewFailureStory(new ImportFailure("authentication"));
export const AccountChangedFailure = previewFailureStory(new ImportFailure("account-changed"));
export const PermissionFailure = previewFailureStory({ code: "permission-denied" });
export const NetworkFailure = previewFailureStory({ code: "unavailable" });
export const StorageFailure = previewFailureStory(new DOMException("private diagnostic", "QuotaExceededError"));
export const UnknownFailure = previewFailureStory(new Error("private diagnostic"));

export const DiagnosticLanguageChange: Story = {
  args: {
    preview: {
      ...preview,
      analysis: {
        rows: [],
        skippedRows: [],
        invalidCount: 5,
        issues: [
          { diagnostic: { kind: "duplicate", uniqueKey: "自作キー" }, context: "ユーザー入力" },
          { diagnostic: { kind: "columns", count: 2 } },
          { diagnostic: { kind: "empty" } },
          { diagnostic: { kind: "parser", type: "Quotes", code: "InvalidQuotes" } },
          { diagnostic: { kind: "parser", type: "private diagnostic", code: "private diagnostic" } },
        ],
      },
    },
  },
  render: (args) => <LocalizedImport {...args} />,
};
function ReselectFileExample(args: DeckImportViewProps) {
  const [selected, setSelected] = useState(false);
  return (
    <DeckImportView
      {...args}
      preview={selected ? preview : undefined}
      onChange={(file) => {
        args.onChange?.(file);
        setSelected(true);
      }}
    />
  );
}
export const ReselectFile: Story = {
  args: { onChange: fn() },
  render: (args) => <ReselectFileExample {...args} />,
};

const longPreview: DeckImportPreview = {
  ...preview,
  deckName: "a-long-file-name-describing-the-entire-study-collection.csv",
  analysis: {
    ...preview.analysis,
    rows: preview.analysis.rows.map((row) => ({
      ...row,
      card: { ...row.card, frontText: row.card.frontText.repeat(40), backText: row.card.backText.repeat(80) },
    })),
  },
};

export const Tablet: Story = {
  args: { preview: longPreview },
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  args: { onSelectExample: fn(), onDownloadExample: fn() },
  render: (args) => (
    <div
      ref={(element) => {
        const format = element?.querySelector("details");
        if (format) format.open = true;
      }}
    >
      <DeckImportView {...args} />
    </div>
  ),
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  parameters: { locale: "ja" },
  args: {
    dark: true,
    preview: {
      ...longPreview,
      analysis: {
        ...longPreview.analysis,
        invalidCount: 1,
        issues: [{ rowNumber: 3, diagnostic: { kind: "columns", count: 3 } }],
      },
    },
  },
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};

export const DarkPending: Story = {
  args: { ...Pending.args, dark: true, validating: false },
  argTypes: { validating: { control: "boolean" } },
  render: (args) => (
    <DeckImportView {...args} preview={args.validating ? undefined : args.preview} pending={!args.validating} />
  ),
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};
