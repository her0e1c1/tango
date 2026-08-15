/**
 * @file Verifies the "DeckImportPage" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "selects a CSV without
 * importing or navigating automatically", "adds the bundled sample without navigating
 * automatically", "navigates to the Deck list after importing the preview", "stays on the import
 * page when importing fails".
 */

import { fireEvent, render, waitFor, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DeckImportPreview, DeckImportResult } from "@/features/deck-import";

const mocks = vi.hoisted(() => ({
  selectFile: vi.fn(),
  importPreview: vi.fn(),
  addSample: vi.fn(),
  retry: vi.fn(),
  navigate: vi.fn(),
  downloadSampleCsv: vi.fn(),
  setDarkMode: vi.fn(),
  preview: undefined as DeckImportPreview | undefined,
  data: undefined as DeckImportResult | undefined,
  partialResult: undefined as DeckImportResult | undefined,
  pending: false,
  validating: false,
  error: null as unknown,
}));

vi.mock("react-router-dom", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("@/entities/deck", () => ({ createDeck: vi.fn(), useDecks: () => [] }));
vi.mock("@/entities/card", () => ({
  createCard: vi.fn(),
  editCard: vi.fn(),
  generateCardId: vi.fn(),
  useCards: () => [],
}));
vi.mock("@/features/deck-import", () => ({
  SAMPLE_CSV_TEXT: "sample csv",
  downloadSampleCsv: mocks.downloadSampleCsv,
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
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

vi.mock("@/entities/preferences", () => ({
  usePreferences: () => ({ appearance: { darkMode: false } }),
  setDarkMode: mocks.setDarkMode,
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

  it("selects a CSV without importing or navigating automatically", async () => {
    render(<DeckImportPage />);
    const file = new File(["front,back,,key"], "deck.csv", { type: "text/csv" });

    fireEvent.change(screen.getByLabelText("Upload a csv file"), {
      target: { files: [file] },
    });
    await userEvent.click(screen.getByRole("button", { name: "Download CSV sample" }));

    expect(mocks.selectFile).toHaveBeenCalledWith(file);
    expect(mocks.importPreview).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(mocks.downloadSampleCsv).toHaveBeenCalledOnce();
  });

  it("renders the import screen in the application shell", () => {
    render(<DeckImportPage />);

    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();
  });

  it("navigates from top and settings keyboard shortcuts", () => {
    render(<DeckImportPage />);

    fireEvent.keyDown(window, { key: "t" });
    fireEvent.keyDown(window, { key: "s" });

    expect(mocks.navigate).toHaveBeenNthCalledWith(1, "/");
    expect(mocks.navigate).toHaveBeenNthCalledWith(2, "/settings");
  });

  it("adds the bundled sample without navigating automatically", async () => {
    render(<DeckImportPage />);

    await userEvent.click(screen.getByRole("button", { name: "Add sample deck" }));

    expect(mocks.addSample).toHaveBeenCalledOnce();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("navigates to the Deck list after importing the preview", async () => {
    mocks.preview = preview;
    render(<DeckImportPage />);

    await userEvent.click(screen.getByRole("button", { name: "Import" }));

    expect(mocks.importPreview).toHaveBeenCalledOnce();
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledExactlyOnceWith("/"));
  });

  it("stays on the import page when importing fails", async () => {
    mocks.preview = preview;
    mocks.importPreview.mockRejectedValue(new Error("Import failed"));
    render(<DeckImportPage />);

    await userEvent.click(screen.getByRole("button", { name: "Import" }));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mocks.importPreview).toHaveBeenCalledOnce();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
