import { cleanup, fireEvent, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DeckImportTemplate } from "@/features/import/components/templates/DeckImportTemplate";

describe("DeckImportTemplate", () => {
  afterEach(cleanup);

  it("composes feedback before the import controls in a bounded semantic route surface", () => {
    const view = render(
      <DeckImportTemplate feedbackSlot={<div role="status">Import failed</div>} sampleText="front,back" />
    );

    const heading = view.getByRole("heading", { level: 1, name: "Import decks" });
    const surface = heading.parentElement;
    const feedback = view.getByRole("status");
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
    expect(surface).toContainElement(feedback);
    expect(surface).toContainElement(upload);
    expect(feedback.compareDocumentPosition(upload as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(view.getByRole("heading", { level: 2, name: "Choose a CSV file" })).toBeInTheDocument();
    expect(view.getByRole("heading", { level: 2, name: "CSV format" })).toBeInTheDocument();
    expect(view.getByRole("heading", { level: 2, name: "Sample" })).toBeInTheDocument();
  });

  it("passes a real file to the upload callback and disables upload while pending", () => {
    const onChange = vi.fn();
    const file = new File(["front,back"], "deck.csv", { type: "text/csv" });
    const view = render(<DeckImportTemplate sampleText="front,back" onChange={onChange} />);
    const input = view.container.querySelector("input[type='file']") as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    expect(onChange).toHaveBeenCalledWith(file);
    view.rerender(<DeckImportTemplate sampleText="front,back" onChange={onChange} pending />);
    expect(view.container.querySelector("input[type='file']")).toBeDisabled();
  });

  it("explains the format and exposes the sample download and code surface", async () => {
    const onDownloadSample = vi.fn();
    const sampleText = "front,back,tag";
    const view = render(<DeckImportTemplate sampleText={sampleText} onDownloadSample={onDownloadSample} />);

    expect(
      view.getByText("There are 3 columns without header: front text, back text, and tags (optional).")
    ).toBeInTheDocument();
    const code = view.container.querySelector("code");
    expect(code).toHaveTextContent(sampleText);
    const sampleSurface = code?.closest("[data-import-sample]");
    expect(sampleSurface).toHaveClass(
      "overflow-x-auto",
      "rounded-surface",
      "border",
      "border-border",
      "bg-surface-muted"
    );

    await userEvent.click(view.getByRole("button", { name: "Download CSV sample" }));

    expect(onDownloadSample).toHaveBeenCalledOnce();
  });
});
