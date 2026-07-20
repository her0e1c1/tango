/**
 * @file Verifies the "DeckImportTemplate" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "composes a bounded semantic
 * import route surface", "passes a real file to the upload callback and disables upload while
 * busy", "documents uniqueKey and exposes sample add, download, and code controls".
 */

import { cleanup, fireEvent, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DeckImportTemplate } from "@/features/import/components/templates/DeckImportTemplate";
import type { DeckImportPreview, DeckImportResult } from "@/features/import/components/deckImportTypes";

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

describe("DeckImportTemplate", () => {
  afterEach(cleanup);

  it("composes a bounded semantic import route surface", () => {
    const view = render(<DeckImportTemplate sampleText="front,back,,key" />);

    const heading = view.getByRole("heading", { level: 1, name: "Import decks" });
    const surface = heading.parentElement;
    const upload = view.container.querySelector<HTMLInputElement>("input[type='file']");

    expect(surface).toHaveClass(
      "mx-auto",
      "w-full",
      "max-w-reading",
      "rounded-surface",
      "border",
      "border-border",
      "bg-surface",
      "p-4",
      "md:p-6"
    );
    expect(surface).toContainElement(upload);
    expect(view.getByRole("heading", { level: 2, name: "Choose a CSV file" })).toBeInTheDocument();
    expect(view.getByRole("heading", { level: 2, name: "CSV format" })).toBeInTheDocument();
    expect(view.getByRole("heading", { level: 2, name: "Sample" })).toBeInTheDocument();
  });

  it("passes a real file to the upload callback and disables upload while busy", () => {
    const onChange = vi.fn();
    const file = new File(["front,back,,key"], "deck.csv", { type: "text/csv" });
    const view = render(<DeckImportTemplate sampleText="front,back,,key" onChange={onChange} />);
    const input = view.container.querySelector("input[type='file']") as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    expect(onChange).toHaveBeenCalledWith(file);
    view.rerender(<DeckImportTemplate sampleText="front,back,,key" onChange={onChange} pending />);
    expect(view.container.querySelector("input[type='file']")).toBeDisabled();
  });

  it("documents uniqueKey and exposes sample add, download, and code controls", async () => {
    const onAddSample = vi.fn();
    const onDownloadSample = vi.fn();
    const sampleText = "front,back,tag,key";
    const view = render(
      <DeckImportTemplate sampleText={sampleText} onAddSample={onAddSample} onDownloadSample={onDownloadSample} />
    );

    expect(view.getByText(/Four columns without a header/)).toHaveTextContent("uniqueKey");
    expect(view.getByText(/uniqueKey is required/)).toBeInTheDocument();
    const code = view.container.querySelector("code");
    expect(code).toHaveTextContent(sampleText);
    expect(code?.closest("[data-import-sample]")).toHaveClass(
      "overflow-x-auto",
      "rounded-surface",
      "border",
      "border-border",
      "bg-surface-muted"
    );

    await userEvent.click(view.getByRole("button", { name: "Add sample deck" }));
    await userEvent.click(view.getByRole("button", { name: "Download CSV sample" }));

    expect(onAddSample).toHaveBeenCalledOnce();
    expect(onDownloadSample).toHaveBeenCalledOnce();
  });

  it("shows validation, planned changes, row content, and waits for explicit import", async () => {
    const onImport = vi.fn();
    const view = render(<DeckImportTemplate sampleText="front,back,,key" preview={preview} onImport={onImport} />);

    expect(view.getAllByText("deck.csv")).toHaveLength(2);
    expect(view.getByText("1 valid")).toBeVisible();
    expect(view.getByText("1 skipped")).toBeVisible();
    expect(view.getByText("0 invalid")).toBeVisible();
    expect(view.getByText("1 create")).toBeVisible();
    expect(view.getByText("0 update")).toBeVisible();
    expect(view.getByText("0 unchanged")).toBeVisible();
    expect(view.getByRole("cell", { name: "front" })).toBeVisible();
    expect(view.getByRole("cell", { name: "key-1" })).toBeVisible();
    expect(onImport).not.toHaveBeenCalled();

    await userEvent.click(view.getByRole("button", { name: "Import" }));

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
    const view = render(<DeckImportTemplate sampleText="front,back,,key" preview={invalidPreview} />);

    const alert = view.getByRole("alert");
    expect(alert).toHaveTextContent("Row 3");
    expect(alert).toHaveTextContent("Expected 4 columns, found 2.");
    expect(alert).toHaveTextContent('["front","back"]');
    expect(view.getByRole("button", { name: "Import" })).toBeDisabled();
    expect(view.getByText("Choose a corrected CSV file to continue.")).toBeVisible();
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
      <DeckImportTemplate sampleText="front,back,,key" result={success} onBack={onBack} onRetry={onRetry} />
    );

    expect(view.getByRole("status")).toHaveTextContent("Import complete");
    expect(view.getByRole("status")).toHaveTextContent("2 created");
    expect(view.getByRole("status")).toHaveTextContent("1 updated");
    expect(view.getByRole("status")).toHaveTextContent("3 skipped");
    await userEvent.click(view.getByRole("button", { name: "Back to decks" }));
    expect(onBack).toHaveBeenCalledOnce();

    view.rerender(
      <DeckImportTemplate
        sampleText="front,back,,key"
        error={new Error("Card writes failed")}
        partialResult={{ ...success, created: 1, failed: 1 }}
        onBack={onBack}
        onRetry={onRetry}
      />
    );
    const alert = view.getByRole("alert");
    expect(alert).toHaveTextContent("Import partially completed");
    expect(alert).toHaveTextContent("1 created");
    expect(alert).toHaveTextContent("1 failed");
    await userEvent.click(view.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
