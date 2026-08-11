/**
 * @file Verifies the "DeckImportPage" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "selects a CSV without
 * importing or navigating automatically", "adds the bundled sample without navigating
 * automatically", "navigates to the Deck list after importing the preview", "stays on the import
 * page when importing fails".
 */

import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { DeckImportPreview, DeckImportResult } from "@/features/import";

const mocks = vi.hoisted(() => ({
  selectFile: vi.fn(),
  importPreview: vi.fn(),
  addSample: vi.fn(),
  retry: vi.fn(),
  navigate: vi.fn(),
  deckDownloadCsvSampleText: vi.fn(),
  goToTop: vi.fn(),
  goToImport: vi.fn(),
  goToSettings: vi.fn(),
  setDarkMode: vi.fn(),
  useKey: vi.fn(),
  preview: undefined as DeckImportPreview | undefined,
  data: undefined as DeckImportResult | undefined,
  partialResult: undefined as DeckImportResult | undefined,
  pending: false,
  validating: false,
  error: null as unknown,
}));

vi.mock("react-router-dom", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("@/features/import", () => ({
  useDeckImport: () => ({
    selectFile: mocks.selectFile,
    importPreview: mocks.importPreview,
    addSample: mocks.addSample,
    retry: mocks.retry,
    preview: mocks.preview,
    data: mocks.data,
    partialResult: mocks.partialResult,
    pending: mocks.pending,
    validating: mocks.validating,
    error: mocks.error,
  }),
}));

vi.mock("@/hooks/useConfig", () => ({ useConfig: () => ({ darkMode: false }) }));

vi.mock("react-use", () => ({
  useKey: mocks.useKey,
}));

vi.mock("@/hooks/useActions", () => ({
  useActions: () => ({
    deckDownloadCsvSampleText: mocks.deckDownloadCsvSampleText,
    goToTop: mocks.goToTop,
    goToSettings: mocks.goToSettings,
    goToImport: mocks.goToImport,
    setDarkMode: mocks.setDarkMode,
  }),
}));

import { DeckImportPage } from "./DeckImportPage";

const preview = {
  fileName: "deck.csv",
  deckName: "deck.csv",
  analysis: {
    rows: [
      {
        rowNumber: 1,
        card: { frontText: "front", backText: "back", tags: [], uniqueKey: "key" },
      },
    ],
    skippedRows: [],
    issues: [],
    invalidCount: 0,
  },
  plan: {
    rows: [
      {
        rowNumber: 1,
        card: { frontText: "front", backText: "back", tags: [], uniqueKey: "key" },
        action: "create",
      },
    ],
    created: 1,
    updated: 0,
    unchanged: 0,
  },
} satisfies DeckImportPreview;

describe("DeckImportPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.selectFile.mockResolvedValue(preview);
    mocks.importPreview.mockResolvedValue({});
    mocks.addSample.mockResolvedValue({});
    mocks.preview = undefined;
    mocks.data = undefined;
    mocks.partialResult = undefined;
    mocks.pending = false;
    mocks.validating = false;
    mocks.error = null;
  });

  afterEach(cleanup);

  it("selects a CSV without importing or navigating automatically", async () => {
    const view = render(<DeckImportPage />);
    const file = new File(["front,back,,key"], "deck.csv", { type: "text/csv" });

    fireEvent.change(view.container.querySelector("input[type='file']") as Element, {
      target: { files: [file] },
    });
    await userEvent.click(view.getByRole("button", { name: "Download CSV sample" }));

    expect(mocks.selectFile).toHaveBeenCalledWith(file);
    expect(mocks.importPreview).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(mocks.deckDownloadCsvSampleText).toHaveBeenCalledOnce();
    expect(mocks.useKey).toHaveBeenCalledWith("t", mocks.goToTop);
    expect(mocks.useKey).toHaveBeenCalledWith("s", mocks.goToSettings);
  });

  it("renders the import screen in the application shell and forwards header actions", async () => {
    const view = render(<DeckImportPage />);
    const logo = view.getByRole("button", { name: "tango" });
    const headerActions = logo.parentElement?.querySelectorAll("svg");

    expect(headerActions).toHaveLength(3);
    await userEvent.click(logo);
    await userEvent.click(headerActions?.[0] as SVGElement);
    await userEvent.click(headerActions?.[1] as SVGElement);
    await userEvent.click(headerActions?.[2] as SVGElement);

    expect(mocks.goToTop).toHaveBeenCalledOnce();
    expect(mocks.setDarkMode).toHaveBeenCalledExactlyOnceWith(true);
    expect(mocks.goToImport).toHaveBeenCalledOnce();
    expect(mocks.goToSettings).toHaveBeenCalledOnce();
  });

  it("adds the bundled sample without navigating automatically", async () => {
    const view = render(<DeckImportPage />);

    await userEvent.click(view.getByRole("button", { name: "Add sample deck" }));

    expect(mocks.addSample).toHaveBeenCalledOnce();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("navigates to the Deck list after importing the preview", async () => {
    mocks.preview = preview;
    const view = render(<DeckImportPage />);

    await userEvent.click(view.getByRole("button", { name: "Import" }));

    expect(mocks.importPreview).toHaveBeenCalledOnce();
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledExactlyOnceWith("/"));
  });

  it("stays on the import page when importing fails", async () => {
    mocks.preview = preview;
    mocks.importPreview.mockRejectedValue(new Error("Import failed"));
    const view = render(<DeckImportPage />);

    await userEvent.click(view.getByRole("button", { name: "Import" }));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mocks.importPreview).toHaveBeenCalledOnce();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
