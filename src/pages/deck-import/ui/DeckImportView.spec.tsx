import { actAsync } from "@/test/act";
import { getI18n } from "react-i18next";
import { ImportFailure } from "../lib/importFailure";
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { deckImportExamples } from "../lib/examples";
import { DeckImportView, type DeckImportViewProps } from "./DeckImportView";

const preview = {
  deckName: "deck.csv",
  analysis: {
    rows: [{ rowNumber: 1, card: { frontText: "front", backText: "back", tags: ["tag"], uniqueKey: "key-1" } }],
    skippedRows: [2],
    issues: [],
    invalidCount: 0,
  },
} satisfies NonNullable<DeckImportViewProps["preview"]>;

describe("DeckImportView [IMPORT-01 IMPORT-02 IMPORT-06 SETTINGS-09]", () => {
  it.each([
    [new ImportFailure("authentication"), "アカウントへのインポートには認証済みユーザーが必要です。"],
    [new ImportFailure("account-changed"), "アカウントが変わりました。CSVファイルや例をもう一度選んでください。"],
    [{ code: "permission-denied" }, "このデータをインポートする権限がありません。"],
    [{ code: "unavailable" }, "接続できませんでした。接続を確認して再試行してください。"],
    [
      new DOMException("raw storage error", "QuotaExceededError"),
      "データを保存できませんでした。ストレージの空き容量を確保して再試行してください。",
    ],
    [new Error("private server details"), "インポートのプレビューを準備できませんでした。"],
  ])("localizes preview failure %s and updates it in place", async (error, message) => {
    render(<DeckImportView examples={deckImportExamples} previewError={error} />);
    const alert = screen.getByRole("alert");
    await actAsync(() => getI18n().changeLanguage("ja"));
    expect(screen.getByRole("alert")).toBe(alert);
    expect(alert).toHaveTextContent(message);
    expect(alert).not.toHaveTextContent("private server details");
  });

  it("localizes each cached diagnostic while keeping literal user context", async () => {
    render(
      <DeckImportView
        examples={deckImportExamples}
        preview={{
          ...preview,
          analysis: {
            ...preview.analysis,
            invalidCount: 5,
            issues: [
              { diagnostic: { kind: "duplicate", uniqueKey: "自作キー" }, context: "ユーザー入力" },
              { diagnostic: { kind: "columns", count: 2 } },
              { diagnostic: { kind: "empty" } },
              { diagnostic: { kind: "parser", type: "Quotes", code: "InvalidQuotes" } },
              { diagnostic: { kind: "parser", type: "Unknown", code: "Unknown" } },
            ],
          },
        }}
      />
    );
    await actAsync(() => getI18n().changeLanguage("ja"));
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("一意キー「自作キー」がファイル内で重複しています。");
    expect(alert).toHaveTextContent("ユーザー入力");
    expect(alert).toHaveTextContent("列数は4列である必要があります（現在は2列）。");
    expect(alert).toHaveTextContent("CSVファイルが空です。");
    expect(alert).toHaveTextContent("フィールドの閉じ引用符の形式が正しくありません。");
    expect(alert).toHaveTextContent("CSVを解析できませんでした。形式を確認してください。");
  });

  it("shows file selection first and keeps format details optional", async () => {
    render(<DeckImportView examples={deckImportExamples} />);
    expect(screen.getByRole("heading", { level: 1, name: "Add a deck" })).toBeVisible();
    expect(screen.getByLabelText("Upload a csv file")).toBeEnabled();
    expect(screen.queryByRole("heading", { name: "Review import" })).not.toBeInTheDocument();
    expect(screen.getByText(/Four columns without a header/)).not.toBeVisible();
    await userEvent.click(screen.getByText("CSV format"));
    expect(screen.getByText(/Four columns without a header/)).toBeVisible();
  });

  it("locks file selection while importing and has no storage selector", () => {
    render(<DeckImportView examples={deckImportExamples} pending />);
    expect(screen.queryByRole("group", { name: "Save to" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try this example" })).toBeDisabled();
    expect(screen.getByLabelText("Upload a csv file")).toBeDisabled();
  });

  it.each([
    ["Basic", "basic"],
    ["Math", "math"],
    ["Markdown", "markdown"],
    ["Sample deck", "deck"],
  ])("uses the same preview and download controls for %s", async (label, id) => {
    const onSelectExample = vi.fn();
    const onDownloadExample = vi.fn();
    render(
      <DeckImportView
        examples={deckImportExamples}
        onSelectExample={onSelectExample}
        onDownloadExample={onDownloadExample}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: label }));
    expect(screen.getByRole("button", { name: label })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "Try this example" }));
    expect(onSelectExample).toHaveBeenCalledWith(id);
    screen.getByRole("button", { name: "Download CSV" }).focus();
    await userEvent.keyboard("{Enter}");
    expect(onDownloadExample).toHaveBeenCalledWith(id);
  });

  it("forwards selected files and allows selecting a corrected file after review", () => {
    const onChange = vi.fn();
    const file = new File(["front,back,,key"], "deck.csv");
    const view = render(<DeckImportView examples={deckImportExamples} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Upload a csv file"), { target: { files: [file] } });
    expect(onChange).toHaveBeenCalledWith(file);
    view.rerender(<DeckImportView examples={deckImportExamples} preview={preview} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Upload a csv file"), { target: { files: [file] } });
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("shows card contents and requires explicit confirmation", async () => {
    const onImport = vi.fn();
    const onChooseAgain = vi.fn();
    render(
      <DeckImportView
        examples={deckImportExamples}
        preview={preview}
        onImport={onImport}
        onChooseAgain={onChooseAgain}
      />
    );
    expect(screen.getByText("front")).toBeVisible();
    expect(screen.getByText("back")).toBeVisible();
    expect(screen.getByText("uniqueKey: key-1")).toBeVisible();
    expect(screen.getByText("1 blank row skipped")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Try this example" })).not.toBeInTheDocument();
    expect(onImport).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Choose file or example" }));
    expect(onChooseAgain).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole("button", { name: "Add 1 card" }));
    expect(onImport).toHaveBeenCalledOnce();
  });

  it("blocks all cards when any row is invalid and explains how to recover", () => {
    render(
      <DeckImportView
        examples={deckImportExamples}
        preview={{
          ...preview,
          analysis: {
            ...preview.analysis,
            invalidCount: 1,
            issues: [
              {
                rowNumber: 3,
                diagnostic: { kind: "card", field: "uniqueKey", reason: "required" },
                context: '["bad","back","",""]',
              },
            ],
          },
        }}
      />
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Row 3: Unique key is required.");
    expect(screen.getByRole("alert")).toHaveTextContent("Choose a corrected CSV file to continue.");
    expect(screen.getByRole("button", { name: "Add 1 card" })).toBeDisabled();
  });

  it("explains preparation failures and leaves selection available", () => {
    render(<DeckImportView examples={deckImportExamples} previewError={new Error("file read failed")} />);
    expect(screen.getByRole("alert")).toHaveTextContent("The import preview could not be prepared.");
    expect(screen.getByRole("alert")).not.toHaveTextContent("file read failed");
    expect(screen.getByLabelText("Upload a csv file")).toBeEnabled();
    expect(screen.getByRole("button", { name: "Try this example" })).toBeEnabled();
  });
});
