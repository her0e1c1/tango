import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { DeckImportView, type DeckImportViewProps } from "./DeckImportView";

type DeckImportPreview = NonNullable<DeckImportViewProps["preview"]>;
type DeckImportResult = NonNullable<DeckImportViewProps["result"]>;

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

describe("DeckImportView", () => {
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
            message: "Expected 4 columns, found 2.",
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
    expect(alert).toHaveTextContent("server read failed");
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
  });

  it("shows success and failure results without a retry action", async () => {
    const onBack = vi.fn();
    const success = {
      created: 2,
    } satisfies DeckImportResult;
    const view = render(<DeckImportView sampleText="front,back,,key" result={success} onBack={onBack} />);

    expect(screen.getByRole("status")).toHaveTextContent("Import complete");
    expect(screen.getByRole("status")).toHaveTextContent("2 created");
    expect(screen.getByRole("status")).not.toHaveTextContent("updated");
    expect(screen.getByRole("status")).not.toHaveTextContent("skipped");
    await userEvent.click(screen.getByRole("button", { name: "Back to decks" }));
    expect(onBack).toHaveBeenCalledOnce();

    view.rerender(
      <DeckImportView sampleText="front,back,,key" error={new Error("Card writes failed")} onBack={onBack} />
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Import failed");
    expect(alert).toHaveTextContent("Card writes failed");
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
  });
});
