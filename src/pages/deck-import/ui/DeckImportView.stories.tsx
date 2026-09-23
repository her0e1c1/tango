import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ImportFailure } from "../lib/importFailure";
import { expect, fn } from "storybook/test";
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

export const Default: Story = {
  play: async ({ canvas, step }) => {
    await step("STORYBOOK-IMPORT-01 Initial import screen", async () => {
      await expect(canvas.queryByRole("radio")).not.toBeInTheDocument();
      await expect(canvas.getByRole("heading", { name: "Add a deck" })).toBeVisible();
    });
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
  play: async ({ canvas, step }) => {
    await step("STORYBOOK-IMPORT-03 Japanese diagnostics", async () => {
      await expect(canvas.getByRole("alert")).toHaveTextContent("列数は4列である必要があります（現在は3列）。");
      await expect(canvas.getByRole("button", { name: /^0枚のカードを追加$/ })).toBeDisabled();
      await expect(document.documentElement).toHaveAttribute("lang", "ja");
    });
  },
};

export const FormatDisclosure: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-IMPORT-06 Reveal CSV format guidance on demand", async () => {
      await expect(canvas.getByLabelText("Upload a csv file")).toBeEnabled();
      await expect(canvas.queryByRole("heading", { name: "Review import" })).not.toBeInTheDocument();
      const columns = canvas.getByText(
        "Four columns without a header: front text, back text, tags (optional), and uniqueKey."
      );
      await expect(columns).not.toBeVisible();
      await userEvent.click(canvas.getByText("CSV format", { exact: true }));
      await expect(columns).toBeVisible();
    });
  },
};

export const PendingSelection: Story = {
  args: { pending: true },
  play: async ({ canvas, step }) => {
    await step("STORYBOOK-IMPORT-07 Disable selection while importing", async () => {
      await expect(canvas.getByLabelText("Upload a csv file")).toBeDisabled();
      await expect(canvas.getByRole("button", { name: "Try this example" })).toBeDisabled();
      await expect(canvas.queryByRole("group", { name: "Save to" })).not.toBeInTheDocument();
      await expect(canvas.queryByRole("radio")).not.toBeInTheDocument();
    });
  },
};

export const ExampleRequests: Story = {
  args: { onSelectExample: fn(), onDownloadExample: fn() },
  play: async ({ args, canvas, userEvent, step }) => {
    await step("STORYBOOK-IMPORT-08 Request preview and download of each example", async () => {
      for (const [name, id] of [
        ["Basic", "basic"],
        ["Math", "math"],
        ["Markdown", "markdown"],
        ["Sample deck", "deck"],
      ]) {
        if (!name || !id) throw new Error("An example requires a label and ID");
        const example = canvas.getByRole("button", { name });
        await userEvent.click(example);
        await expect(example).toBePressed();
        await userEvent.click(canvas.getByRole("button", { name: "Try this example" }));
        await expect(args.onSelectExample).toHaveBeenLastCalledWith(id);
        canvas.getByRole("button", { name: "Download CSV" }).focus();
        await userEvent.keyboard("{Enter}");
        await expect(args.onDownloadExample).toHaveBeenLastCalledWith(id);
      }
    });
  },
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
  play: async ({ args, canvas, userEvent, step }) => {
    await step("STORYBOOK-IMPORT-10 Save only after explicit confirmation", async () => {
      for (const text of ["front", "back", "uniqueKey: key-1", "1 blank row skipped"])
        await expect(canvas.getByText(text, { exact: true })).toBeVisible();
      await expect(canvas.queryByRole("button", { name: "Try this example" })).not.toBeInTheDocument();
      await expect(args.onImport).not.toHaveBeenCalled();
      await userEvent.click(canvas.getByRole("button", { name: "Choose file or example" }));
      await expect(args.onChooseAgain).toHaveBeenCalledOnce();
      await expect(args.onImport).not.toHaveBeenCalled();
      await userEvent.click(canvas.getByRole("button", { name: "Add 1 card" }));
      await expect(args.onImport).toHaveBeenCalledOnce();
    });
  },
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
  play: async ({ canvas, step }) => {
    await step("STORYBOOK-IMPORT-11 Reject confirmation when any row is invalid", async () => {
      await expect(canvas.getByRole("alert")).toHaveTextContent("Row 3: Unique key is required.");
      await expect(canvas.getByRole("alert")).toHaveTextContent("Choose a corrected CSV file to continue.");
      await expect(canvas.getByRole("button", { name: "Add 1 card" })).toBeDisabled();
    });
  },
};

export const SafePreviewFailure: Story = {
  args: { previewError: new Error("file read failed") },
  play: async ({ canvas, step }) => {
    await step("STORYBOOK-IMPORT-12 Keep selection available after a safe error", async () => {
      await expect(canvas.getByText("The import preview could not be prepared.")).toBeVisible();
      await expect(canvas.queryByText("file read failed")).not.toBeInTheDocument();
      await expect(canvas.getByLabelText("Upload a csv file")).toBeEnabled();
      await expect(canvas.getByRole("button", { name: "Try this example" })).toBeEnabled();
    });
  },
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
function previewFailureStory(error: unknown, english: string, japanese: string): Story {
  return {
    args: { previewError: error },
    render: (args) => <LocalizedImport {...args} />,
    play: async ({ canvas, userEvent, step }) => {
      await step("STORYBOOK-IMPORT-04 Translate safe preview failure messages", async () => {
        await expect(canvas.getByRole("alert")).toHaveTextContent(english);
        await userEvent.click(canvas.getByRole("button", { name: "Japanese" }));
        await expect(canvas.getByRole("alert")).toHaveTextContent(japanese);
        await expect(canvas.getByRole("alert")).not.toHaveTextContent("private diagnostic");
      });
    },
  };
}
export const AuthenticationFailure = previewFailureStory(
  new ImportFailure("authentication"),
  "A confirmed user is required",
  "アカウントへのインポートには認証済みユーザーが必要です。"
);
export const AccountChangedFailure = previewFailureStory(
  new ImportFailure("account-changed"),
  "The account has changed",
  "アカウントが変わりました。CSVファイルや例をもう一度選んでください。"
);
export const PermissionFailure = previewFailureStory(
  { code: "permission-denied" },
  "You do not have permission",
  "このデータをインポートする権限がありません。"
);
export const NetworkFailure = previewFailureStory(
  { code: "unavailable" },
  "Unable to connect",
  "接続できませんでした。接続を確認して再試行してください。"
);
export const StorageFailure = previewFailureStory(
  new DOMException("private diagnostic", "QuotaExceededError"),
  "Free some storage space",
  "データを保存できませんでした。ストレージの空き容量を確保して再試行してください。"
);
export const UnknownFailure = previewFailureStory(
  new Error("private diagnostic"),
  "The import preview could not be prepared",
  "インポートのプレビューを準備できませんでした。"
);

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
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-IMPORT-05 Translate diagnostics while preserving user input", async () => {
      await expect(canvas.getByRole("alert")).toHaveTextContent('uniqueKey "自作キー" is duplicated');
      await userEvent.click(canvas.getByRole("button", { name: "Japanese" }));
      for (const message of [
        "一意キー「自作キー」がファイル内で重複しています。",
        "ユーザー入力",
        "列数は4列である必要があります（現在は2列）。",
        "CSVファイルが空です。",
        "フィールドの閉じ引用符の形式が正しくありません。",
        "CSVを解析できませんでした。形式を確認してください。",
      ]) {
        await expect(canvas.getByRole("alert")).toHaveTextContent(message);
      }
      await expect(canvas.getByRole("alert")).not.toHaveTextContent("private diagnostic");
    });
  },
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
  play: async ({ args, canvas, userEvent, step }) => {
    await step("STORYBOOK-IMPORT-09 Select a file before and after preview", async () => {
      const first = new File(["front,back,,key"], "deck.csv", { type: "text/csv" });
      await userEvent.upload(canvas.getByLabelText("Upload a csv file"), first);
      await expect(args.onChange).toHaveBeenLastCalledWith(first);
      await expect(canvas.getByRole("heading", { name: "Review import" })).toBeVisible();
      const replacement = new File(["next,answer,,next"], "replacement.csv", { type: "text/csv" });
      await userEvent.upload(canvas.getByLabelText("Upload a csv file"), replacement);
      await expect(args.onChange).toHaveBeenLastCalledWith(replacement);
      await expect(args.onChange).toHaveBeenCalledTimes(2);
    });
  },
};
