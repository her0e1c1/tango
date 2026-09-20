import { actAsync } from "@/test/act";
import { getI18n } from "react-i18next";
import { ImportFailure } from "../lib/importFailure";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { DeckImportView, type DeckImportViewProps } from "./DeckImportView";

type DeckImportPreview = NonNullable<DeckImportViewProps["preview"]>;

const preview = {
  deckName: "deck.csv",
  analysis: {
    rows: [
      {
        rowNumber: 1,
        card: { frontText: "front", backText: "back", tags: ["tag"], uniqueKey: "key-1" },
      },
    ],
    skippedRows: [2],
    issues: [],
    invalidCount: 0,
  },
} satisfies DeckImportPreview;

describe("IMPORT-01 IMPORT-02 IMPORT-05 IMPORT-06 SETTINGS-09 DeckImportView", () => {
  it.each([
    [new ImportFailure("authentication"), "アカウントへのインポートには認証済みユーザーが必要です。"],
    [new ImportFailure("account-changed"), "アカウントが変わりました。CSVファイルを選び直してください。"],
    [{ code: "permission-denied" }, "このデータをインポートする権限がありません。"],
    [{ code: "unavailable" }, "接続できませんでした。接続を確認して再試行してください。"],
    [
      new DOMException("raw storage error", "QuotaExceededError"),
      "データを保存できませんでした。ストレージの空き容量を確保して再試行してください。",
    ],
    [new Error("private server details"), "インポートのプレビューを準備できませんでした。"],
  ])("localizes preview failure %s and updates it in place", async (error, message) => {
    render(<DeckImportView sampleText="front,back,,key" previewError={error} />);
    const alert = screen.getByRole("alert");
    await actAsync(() => getI18n().changeLanguage("ja"));
    expect(screen.getByRole("alert")).toBe(alert);
    expect(alert).toHaveTextContent(message);
    expect(alert).not.toHaveTextContent("private server details");
  });

  it("localizes each cached diagnostic while keeping literal user context", async () => {
    render(
      <DeckImportView
        sampleText="front,back,,key"
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

  it("composes a bounded semantic import route surface", () => {
    render(<DeckImportView sampleText="front,back,,key" />);

    const heading = screen.getByRole("heading", { level: 1, name: "Import decks" });

    expect(heading).toBeVisible();
    expect(screen.queryByRole("button", { name: "tango" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Upload a csv file")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Choose a CSV file" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "CSV format" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Sample" })).toBeInTheDocument();
  });

  it("passes a real file to the upload callback and disables upload while busy", () => {
    const onChange = vi.fn();
    const file = new File(["front,back,,key"], "deck.csv", { type: "text/csv" });
    const view = render(<DeckImportView sampleText="front,back,,key" onChange={onChange} />);
    const input = screen.getByLabelText("Upload a csv file");

    fireEvent.change(input, { target: { files: [file] } });

    expect(onChange).toHaveBeenCalledWith(file);
    view.rerender(<DeckImportView sampleText="front,back,,key" onChange={onChange} pending />);
    expect(screen.getByLabelText("Upload a csv file")).toBeDisabled();
  });

  it("selects whether imported Decks stay local or sync with the account", async () => {
    const onStorageModeChange = vi.fn();
    const view = render(
      <DeckImportView sampleText="front,back,,key" storageMode="remote" onStorageModeChange={onStorageModeChange} />
    );
    const csvStorage = screen.getByRole("group", { name: "Save this CSV import" });
    const localMode = within(csvStorage).getByRole("radio", { name: /Local only/ });
    const remoteMode = within(csvStorage).getByRole("radio", { name: /Sync with account/ });

    expect(localMode).not.toBeChecked();
    expect(remoteMode).toBeChecked();

    await userEvent.click(localMode);
    expect(onStorageModeChange).toHaveBeenCalledExactlyOnceWith("local");

    view.rerender(
      <DeckImportView
        sampleText="front,back,,key"
        storageMode="local"
        onStorageModeChange={onStorageModeChange}
        pending
      />
    );
    expect(screen.getByRole("radio", { name: /Local only/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: /Local only/ })).toBeDisabled();
    expect(screen.getByRole("radio", { name: /Sync with account/ })).toBeDisabled();
  });

  it("documents uniqueKey and exposes sample add, download, and code controls", async () => {
    const onAddSample = vi.fn();
    const onDownloadSample = vi.fn();
    const sampleText = "front,back,tag,key";
    render(<DeckImportView sampleText={sampleText} onAddSample={onAddSample} onDownloadSample={onDownloadSample} />);

    expect(screen.getByText(/Four columns without a header/)).toHaveTextContent("uniqueKey");
    expect(screen.getByText(/uniqueKey is required/)).toHaveTextContent("must be unique within the CSV file");
    expect(screen.getAllByText("front").length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole("button", { name: "Add sample deck" }));
    await userEvent.click(screen.getByRole("button", { name: "Download CSV sample" }));

    expect(onAddSample).toHaveBeenCalledOnce();
    expect(onDownloadSample).toHaveBeenCalledOnce();
  });

  it("loads only the sample action while a Sample Deck is being added", () => {
    render(<DeckImportView sampleText="front,back,,key" preview={preview} addingSample />);

    const addSample = screen.getByRole("button", { name: "Add sample deck" });
    const importDeck = screen.getByRole("button", { name: "Import" });

    expect(addSample).toBeDisabled();
    expect(addSample).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Loading Add sample deck");
    expect(importDeck).toBeDisabled();
    expect(importDeck).not.toHaveAttribute("aria-busy");
    expect(screen.getByLabelText(/Upload a csv file/u)).toBeDisabled();
  });

  it("activates the CSV sample download with Enter", async () => {
    const onDownloadSample = vi.fn();
    const user = userEvent.setup();
    render(<DeckImportView sampleText="front,back" onDownloadSample={onDownloadSample} />);

    screen.getByRole("button", { name: "Download CSV sample" }).focus();
    await user.keyboard("{Enter}");

    expect(onDownloadSample).toHaveBeenCalledOnce();
  });

  it("shows validation and row content, and waits for explicit import", async () => {
    const onImport = vi.fn();
    render(<DeckImportView sampleText="front,back,,key" preview={preview} onImport={onImport} />);

    expect(screen.getAllByText("deck.csv")).toHaveLength(2);
    expect(screen.getByText("1 valid")).toBeVisible();
    expect(screen.getByText("1 skipped")).toBeVisible();
    expect(screen.getByText("0 invalid")).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Planned changes" })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Action" })).not.toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "front" })).toBeVisible();
    expect(screen.getByRole("cell", { name: "key-1" })).toBeVisible();
    expect(onImport).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Import" }));

    expect(onImport).toHaveBeenCalledOnce();
  });

  it("shows invalid row context and requires a corrected file", () => {
    const invalidPreview: DeckImportPreview = {
      ...preview,
      analysis: {
        rows: [],
        skippedRows: [],
        invalidCount: 1,
        issues: [
          {
            rowNumber: 3,
            diagnostic: { kind: "columns", count: 2 },
            context: '["front","back"]',
          },
        ],
      },
    };
    render(<DeckImportView sampleText="front,back,,key" preview={invalidPreview} />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Row 3");
    expect(alert).toHaveTextContent("Expected 4 columns, found 2.");
    expect(alert).toHaveTextContent('["front","back"]');
    expect(screen.getByRole("button", { name: "Import" })).toBeDisabled();
    expect(screen.getByText("Choose a corrected CSV file to continue.")).toBeVisible();
  });

  it("shows preview preparation failures without an ineffective retry action", () => {
    render(<DeckImportView sampleText="front,back,,key" previewError={new Error("server read failed")} />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Unable to prepare preview");
    expect(alert).toHaveTextContent("The import preview could not be prepared.");
    expect(alert).not.toHaveTextContent("server read failed");
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
  });
});
