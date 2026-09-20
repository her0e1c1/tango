vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
import { fireEvent, render, screen, within } from "@testing-library/react";
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

describe("DeckImportView [IMPORT-01 IMPORT-02 IMPORT-06]", () => {
  it("shows file selection first and keeps format details optional", async () => {
    render(<DeckImportView examples={deckImportExamples} />);
    expect(screen.getByRole("heading", { level: 1, name: "Add a deck" })).toBeVisible();
    expect(screen.getByLabelText("Upload a csv file")).toBeEnabled();
    expect(screen.queryByRole("heading", { name: "Review import" })).not.toBeInTheDocument();
    expect(screen.getByText(/Four columns without a header/)).not.toBeVisible();
    await userEvent.click(screen.getByText("CSV format"));
    expect(screen.getByText(/Four columns without a header/)).toBeVisible();
  });

  it("selects and locks the common destination", async () => {
    const onStorageModeChange = vi.fn();
    const view = render(<DeckImportView examples={deckImportExamples} onStorageModeChange={onStorageModeChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Change" }));
    const group = screen.getByRole("group", { name: "Save to" });
    await userEvent.click(within(group).getByRole("radio", { name: /Local only/ }));
    expect(onStorageModeChange).toHaveBeenCalledWith("local");
    view.rerender(<DeckImportView examples={deckImportExamples} storageMode="local" pending />);
    expect(screen.getByRole("radio", { name: /Local only/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: /Local only/ })).toBeDisabled();
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
            issues: [{ rowNumber: 3, message: "Unique key is required.", context: '["bad","back","",""]' }],
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
    expect(screen.getByRole("alert")).toHaveTextContent("file read failed");
    expect(screen.getByLabelText("Upload a csv file")).toBeEnabled();
    expect(screen.getByRole("button", { name: "Try this example" })).toBeEnabled();
  });
});
