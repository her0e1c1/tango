import type { StoryObj } from "@storybook/react-vite";
import { expect, mocked, waitFor, within } from "storybook/test";
import { appI18n } from "@/app/i18n/instance";
import { createDeck } from "@/entities/deck";
import { ImportFailure } from "@/pages/deck-import/lib/importFailure";
import { deckImportStore } from "@/pages/deck-import/model/store";
import { routeMeta, state, prepareWith } from "./support";

const meta = {
  ...routeMeta,
  title: "Integration/Deck import",
  parameters: { ...routeMeta.parameters, page: { ...state, path: "/import" } },
};
export default meta;
type Story = StoryObj<typeof meta>;
const csv = "front,back,,key-1\n";
const csvFile = (text = csv, name = "deck.csv") => new File([text], name, { type: "text/csv" });

export const InitialAndFormat: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-IMPORT-01 Offer file selection without a destination radio", async () => {
      await expect(await canvas.findByRole("heading", { name: "Add a deck" })).toBeVisible();
      await expect(canvas.getByLabelText("Upload a csv file")).toBeEnabled();
      await expect(canvas.queryByRole("radio")).not.toBeInTheDocument();
      await expect(canvas.queryByRole("heading", { name: "Review import" })).not.toBeInTheDocument();
    });
    await step("STORYBOOK-IMPORT-06 Reveal the four-column CSV guidance on demand", async () => {
      const guidance = canvas.getByText(
        "Four columns without a header: front text, back text, tags (optional), and uniqueKey."
      );
      await expect(guidance).not.toBeVisible();
      await userEvent.click(canvas.getByText("CSV format"));
      await expect(guidance).toBeVisible();
      await expect(canvas.getByLabelText("Upload a csv file")).toBeEnabled();
      await expect(canvas.queryByRole("heading", { name: "Review import" })).not.toBeInTheDocument();
    });
  },
};
export const ReviewAndConfirm: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-IMPORT-10 Review both sides, key and skipped rows before confirmation", async () => {
      await userEvent.upload(await canvas.findByLabelText("Upload a csv file"), csvFile());
      const preview = await canvas.findByRole("region", { name: "Review import" });
      await expect(within(preview).getByText("front", { exact: true })).toBeVisible();
      await expect(within(preview).getByText("back", { exact: true })).toBeVisible();
      await expect(within(preview).getByText("uniqueKey: key-1")).toBeVisible();
      await expect(within(preview).getByText("1 blank row skipped")).toBeVisible();
      await expect(canvas.getByRole("heading", { name: "Add a deck" })).toBeVisible();
      await userEvent.click(canvas.getByRole("button", { name: "Choose file or example" }));
      await expect(canvas.queryByRole("heading", { name: "Review import" })).not.toBeInTheDocument();
      await expect(canvas.getByRole("status", { name: "Toast notifications" })).toBeEmptyDOMElement();
      await userEvent.upload(canvas.getByLabelText("Upload a csv file"), csvFile());
      await userEvent.click(await canvas.findByRole("button", { name: "Add 1 card" }));
      await expect(await canvas.findByRole("heading", { name: "Decks" })).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Study deck.csv" })).toBeVisible();
      await expect(canvas.getByRole("status", { name: "Toast notifications" })).toHaveTextContent(/Imported 1 card/);
    });
  },
};
export const Reselect: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-IMPORT-09 Replace the preview without mixing file contents", async () => {
      await userEvent.upload(await canvas.findByLabelText("Upload a csv file"), csvFile());
      await expect(await canvas.findByRole("region", { name: "Review import" })).toHaveTextContent("uniqueKey: key-1");
      await userEvent.upload(
        canvas.getByLabelText("Upload a csv file"),
        csvFile("different,answer,,key-2", "different.csv")
      );
      const preview = canvas.getByRole("region", { name: "Review import" });
      await waitFor(() => expect(preview).toHaveTextContent("uniqueKey: key-2"));
      await expect(preview).toHaveTextContent("different.csv");
      await expect(preview).not.toHaveTextContent("uniqueKey: key-1");
      await expect(within(preview).getByText("answer", { exact: true })).toBeVisible();
    });
  },
};
export const PartlyInvalid: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-IMPORT-11 Block the entire import when row three has no key", async () => {
      await userEvent.upload(
        await canvas.findByLabelText("Upload a csv file"),
        csvFile("front,back,,key-1\n\ninvalid,answer,,")
      );
      await expect(await canvas.findByRole("alert")).toHaveTextContent("Row 3: Unique key is required.");
      await expect(canvas.getByRole("alert")).toHaveTextContent("Choose a corrected CSV file to continue.");
      await expect(canvas.getByText("1 valid", { exact: true })).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Add 1 card" })).toBeDisabled();
    });
  },
};
export const JapaneseInvalid: Story = {
  parameters: { locale: "ja" },
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-IMPORT-03 Show Japanese diagnostics and disable an invalid import", async () => {
      await userEvent.upload(await canvas.findByLabelText("CSVファイルをアップロード"), csvFile("front,back,key"));
      await expect(await canvas.findByRole("alert")).toHaveTextContent("列数は4列である必要があります（現在は3列）。");
      await expect(canvas.getByText("有効: 0件", { exact: true })).toBeVisible();
      await expect(canvas.getByRole("button", { name: "0枚のカードを追加" })).toBeDisabled();
    });
  },
};
export const PendingSelection: Story = {
  beforeEach: prepareWith(() => {
    // An import started on an earlier visit keeps its lock when the Page is opened again.
    deckImportStore.setState({ status: "importing", source: { kind: "empty" } });
  }),
  play: async ({ canvas, step }) => {
    await step("STORYBOOK-IMPORT-07 Disable selection during an outstanding import", async () => {
      await expect(await canvas.findByText("Importing…")).toBeVisible();
      await expect(canvas.getByLabelText("Upload a csv file")).toBeDisabled();
      await expect(canvas.getByRole("button", { name: "Try this example" })).toBeDisabled();
      await expect(canvas.queryByRole("radio")).not.toBeInTheDocument();
    });
  },
};
function exampleStory(name: string, key: string): Story {
  return {
    play: async ({ canvas, userEvent, step }) => {
      await step("STORYBOOK-IMPORT-08 Preview the selected example through real CSV parsing", async () => {
        await userEvent.click(await canvas.findByRole("button", { name }));
        await expect(canvas.getByRole("button", { name })).toHaveAttribute("aria-pressed", "true");
        canvas.getByRole("button", { name: "Try this example" }).focus();
        await userEvent.tab();
        await expect(canvas.getByRole("button", { name: "Download CSV" })).toHaveFocus();
        await expect(canvas.getByRole("button", { name: "Download CSV" })).toBeEnabled();
        await userEvent.click(canvas.getByRole("button", { name: "Try this example" }));
        const preview = await canvas.findByRole("region", { name: "Review import" });
        await expect(preview).toHaveTextContent(key);
        await expect(within(preview).getByRole("button", { name: /Add .* cards/ })).toBeEnabled();
      });
    },
  };
}
export const Basic = exampleStory("Basic", "apple-001");
export const Math = exampleStory("Math", "circle-area");
export const Markdown = exampleStory("Markdown", "markdown-source");
export const SampleDeck = exampleStory("Sample deck", "test/binarysearch/test_bisect_left.py");

function failureStory(error: unknown, japanese: string): Story {
  return {
    play: async ({ canvas, userEvent, step }) => {
      await step("STORYBOOK-IMPORT-04 Translate safe preparation failures", async () => {
        const file = csvFile();
        Object.defineProperty(file, "arrayBuffer", { value: () => Promise.reject(error) });
        await userEvent.upload(await canvas.findByLabelText("Upload a csv file"), file);
        await expect(await canvas.findByRole("alert")).toBeVisible();
        await appI18n.changeLanguage("ja");
        await expect(canvas.getByRole("alert")).toHaveTextContent(japanese);
        await expect(canvas.getByRole("alert")).not.toHaveTextContent("private diagnostic");
        await expect(canvas.getByLabelText("CSVファイルをアップロード")).toBeEnabled();
      });
    },
  };
}
export const AuthenticationFailure = failureStory(
  new ImportFailure("authentication"),
  "アカウントへのインポートには認証済みユーザーが必要です。"
);
export const AccountChanged = failureStory(
  new ImportFailure("account-changed"),
  "アカウントが変わりました。CSVファイルや例をもう一度選んでください。"
);
export const PermissionFailure = failureStory(
  { code: "permission-denied", message: "private diagnostic" },
  "このデータをインポートする権限がありません。"
);
export const NetworkFailure = failureStory(
  { code: "unavailable", message: "private diagnostic" },
  "接続できませんでした。接続を確認して再試行してください。"
);
export const StorageFailure = failureStory(
  new DOMException("private diagnostic", "QuotaExceededError"),
  "データを保存できませんでした。ストレージの空き容量を確保して再試行してください。"
);
export const UnknownFailure = failureStory(
  new Error("private diagnostic"),
  "インポートのプレビューを準備できませんでした。"
);
export const ReadFailure: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-IMPORT-12 Recover from an unreadable file with a new selection", async () => {
      const file = csvFile();
      Object.defineProperty(file, "arrayBuffer", { value: () => Promise.reject(new Error("file read failed")) });
      await userEvent.upload(await canvas.findByLabelText("Upload a csv file"), file);
      await expect(await canvas.findByRole("alert")).toHaveTextContent("The import preview could not be prepared.");
      await expect(canvas.getByRole("alert")).not.toHaveTextContent("file read failed");
      await expect(canvas.getByLabelText("Upload a csv file")).toBeEnabled();
      await expect(canvas.getByRole("button", { name: "Try this example" })).toBeEnabled();
      await userEvent.upload(canvas.getByLabelText("Upload a csv file"), csvFile());
      await expect(await canvas.findByRole("region", { name: "Review import" })).toHaveTextContent("uniqueKey: key-1");
    });
  },
};
export const TranslatedDiagnostics: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-IMPORT-05 Translate parsed CSV diagnostics and retain user input", async () => {
      for (const [text, message, userText] of [
        [
          "ユーザー入力,answer,,自作キー\nother,answer,,自作キー",
          "一意キー「自作キー」がファイル内で重複しています。",
          "自作キー",
        ],
        ["ユーザー入力,answer", "列数は4列である必要があります（現在は2列）。", "ユーザー入力"],
        ["", "CSVファイルが空です。", ""],
        ['"ユーザー入力"bad,answer,,key', "フィールドの閉じ引用符の形式が正しくありません。", "ユーザー入力"],
      ] as const) {
        await appI18n.changeLanguage("en");
        await userEvent.upload(canvas.getByLabelText("Upload a csv file"), csvFile(text));
        await expect(await canvas.findByRole("alert")).toBeVisible();
        await appI18n.changeLanguage("ja");
        await expect(canvas.getByRole("alert")).toHaveTextContent(message);
        if (userText) await expect(canvas.getByRole("alert")).toHaveTextContent(userText);
        await userEvent.click(canvas.getByRole("button", { name: "ファイル・例を選び直す" }));
      }
    });
  },
};
export const UnknownDiagnostic: Story = {
  beforeEach: prepareWith(() => {
    deckImportStore.setState({
      status: "idle",
      source: {
        kind: "selected",
        preview: {
          deckName: "ユーザー入力.csv",
          analysis: {
            rows: [],
            skippedRows: [],
            invalidCount: 1,
            issues: [
              {
                diagnostic: { kind: "parser", type: "private diagnostic", code: "private diagnostic" },
                context: "ユーザー入力",
              },
            ],
          },
        },
        preparedImport: undefined,
      },
    });
  }),
  play: async ({ canvas, step }) => {
    await step("STORYBOOK-IMPORT-05 Translate an unknown parser diagnostic without exposing internals", async () => {
      await expect(await canvas.findByRole("alert")).toHaveTextContent("The CSV could not be parsed.");
      await appI18n.changeLanguage("ja");
      await expect(canvas.getByRole("alert")).toHaveTextContent("CSVを解析できませんでした。形式を確認してください。");
      await expect(canvas.getByRole("alert")).toHaveTextContent("ユーザー入力");
      await expect(canvas.getByRole("alert")).not.toHaveTextContent("private diagnostic");
    });
  },
};
export const PendingConfirmation: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-IMPORT-10 Begin importing only after Add is selected", async () => {
      const original = mocked(createDeck).getMockImplementation()!;
      let finish!: () => void;
      mocked(createDeck).mockImplementationOnce(async (...args) => {
        await new Promise<void>((resolve) => {
          finish = resolve;
        });
        await original(...args);
      });
      await userEvent.upload(await canvas.findByLabelText("Upload a csv file"), csvFile());
      await userEvent.click(await canvas.findByRole("button", { name: "Add 1 card" }));
      await expect(await canvas.findByText("Importing…")).toBeVisible();
      await expect(canvas.getByLabelText("Upload a csv file")).toBeDisabled();
      finish();
      await expect(await canvas.findByRole("heading", { name: "Decks" })).toBeVisible();
    });
  },
};
