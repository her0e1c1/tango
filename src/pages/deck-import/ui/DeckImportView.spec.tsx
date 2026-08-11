/**
 * @file Verifies the "DeckImportView" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "composes a bounded semantic
 * import route surface", "passes a real file to the upload callback and disables upload while
 * busy", "documents uniqueKey and exposes sample add, download, and code controls".
 */

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import type { DeckImportPreview, DeckImportResult } from "@/features/import";

import { DeckImportView } from "./DeckImportView";

const preview = {
  fileName: "deck.csv",
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
  plan: {
    rows: [
      {
        rowNumber: 1,
        card: { frontText: "front", backText: "back", tags: ["tag"], uniqueKey: "key-1" },
        action: "create",
      },
    ],
    created: 1,
    updated: 0,
    unchanged: 0,
  },
} satisfies DeckImportPreview;

describe("DeckImportView", () => {
  it("composes a bounded semantic import route surface", () => {
    render(<DeckImportView sampleText="front,back,,key" />);

    const heading = screen.getByRole("heading", { level: 1, name: "Import decks" });

    expect(heading).toBeVisible();
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

  it("documents uniqueKey and exposes sample add, download, and code controls", async () => {
    const onAddSample = vi.fn();
    const onDownloadSample = vi.fn();
    const sampleText = "front,back,tag,key";
    render(<DeckImportView sampleText={sampleText} onAddSample={onAddSample} onDownloadSample={onDownloadSample} />);

    expect(screen.getByText(/Four columns without a header/)).toHaveTextContent("uniqueKey");
    expect(screen.getByText(/uniqueKey is required/)).toBeInTheDocument();
    expect(screen.getAllByText("front").length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole("button", { name: "Add sample deck" }));
    await userEvent.click(screen.getByRole("button", { name: "Download CSV sample" }));

    expect(onAddSample).toHaveBeenCalledOnce();
    expect(onDownloadSample).toHaveBeenCalledOnce();
  });

  it("activates the CSV sample download with Enter", async () => {
    const onDownloadSample = vi.fn();
    const user = userEvent.setup();
    render(<DeckImportView sampleText="front,back" onDownloadSample={onDownloadSample} />);

    screen.getByRole("button", { name: "Download CSV sample" }).focus();
    await user.keyboard("{Enter}");

    expect(onDownloadSample).toHaveBeenCalledOnce();
  });

  it("shows validation, planned changes, row content, and waits for explicit import", async () => {
    const onImport = vi.fn();
    render(<DeckImportView sampleText="front,back,,key" preview={preview} onImport={onImport} />);

    expect(screen.getAllByText("deck.csv")).toHaveLength(2);
    expect(screen.getByText("1 valid")).toBeVisible();
    expect(screen.getByText("1 skipped")).toBeVisible();
    expect(screen.getByText("0 invalid")).toBeVisible();
    expect(screen.getByText("1 create")).toBeVisible();
    expect(screen.getByText("0 update")).toBeVisible();
    expect(screen.getByText("0 unchanged")).toBeVisible();
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
      plan: { rows: [], created: 0, updated: 0, unchanged: 0 },
    };
    render(<DeckImportView sampleText="front,back,,key" preview={invalidPreview} />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Row 3");
    expect(alert).toHaveTextContent("Expected 4 columns, found 2.");
    expect(alert).toHaveTextContent('["front","back"]');
    expect(screen.getByRole("button", { name: "Import" })).toBeDisabled();
    expect(screen.getByText("Choose a corrected CSV file to continue.")).toBeVisible();
  });

  it("keeps success and partial failure results visible with recovery actions", async () => {
    const onBack = vi.fn();
    const onRetry = vi.fn();
    const success = {
      created: 2,
      updated: 1,
      skipped: 3,
      failed: 0,
      deckId: "deck",
    } satisfies DeckImportResult;
    const view = render(
      <DeckImportView sampleText="front,back,,key" result={success} onBack={onBack} onRetry={onRetry} />
    );

    expect(screen.getByRole("status")).toHaveTextContent("Import complete");
    expect(screen.getByRole("status")).toHaveTextContent("2 created");
    expect(screen.getByRole("status")).toHaveTextContent("1 updated");
    expect(screen.getByRole("status")).toHaveTextContent("3 skipped");
    await userEvent.click(screen.getByRole("button", { name: "Back to decks" }));
    expect(onBack).toHaveBeenCalledOnce();

    view.rerender(
      <DeckImportView
        sampleText="front,back,,key"
        error={new Error("Card writes failed")}
        partialResult={{ ...success, created: 1, failed: 1 }}
        onBack={onBack}
        onRetry={onRetry}
      />
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Import partially completed");
    expect(alert).toHaveTextContent("1 created");
    expect(alert).toHaveTextContent("1 failed");
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
