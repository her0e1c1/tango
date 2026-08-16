/**
 * @file Verifies the "DeckImportPage" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "selects a CSV without
 * importing or navigating automatically", "adds the bundled sample without navigating
 * automatically", "navigates to the Deck list after importing the preview", "stays on the import
 * page when importing fails".
 */

import type { ComponentProps } from "react";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DeckImportView } from "@/features/deck-import";

type DeckImportViewProps = ComponentProps<typeof DeckImportView>;
type DeckImportPreview = NonNullable<DeckImportViewProps["preview"]>;
type DeckImportResult = NonNullable<DeckImportViewProps["result"]>;

const mocks = vi.hoisted(() => ({
  selectFile: vi.fn(),
  importPreview: vi.fn(),
  addSample: vi.fn(),
  navigate: vi.fn(),
  downloadSampleCsv: vi.fn(),
  setDarkMode: vi.fn(),
  preview: undefined as DeckImportPreview | undefined,
  result: undefined as DeckImportResult | undefined,
  pending: false,
  validating: false,
  error: null as unknown,
  previewError: null as unknown,
  storageMode: "remote" as "local" | "remote",
  setStorageMode: vi.fn(),
}));

vi.mock("react-router-dom", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("@/entities/deck", () => ({ createDeck: vi.fn(), useDecks: () => [] }));
vi.mock("@/entities/card", () => ({
  generateCardId: vi.fn(),
  useCards: () => [],
}));
vi.mock("@/features/deck-import", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/deck-import")>()),
  SAMPLE_CSV_TEXT: "sample csv",
  downloadSampleCsv: mocks.downloadSampleCsv,
  useDeckImport: () => ({
    selectFile: mocks.selectFile,
    importPreview: mocks.importPreview,
    addSample: mocks.addSample,
    preview: mocks.preview,
    result: mocks.result,
    pending: mocks.pending,
    validating: mocks.validating,
    error: mocks.error,
    previewError: mocks.previewError,
    storageMode: mocks.storageMode,
    setStorageMode: mocks.setStorageMode,
  }),
}));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

vi.mock("@/entities/preferences", () => ({
  usePreferences: () => ({ appearance: { darkMode: false } }),
  setDarkMode: mocks.setDarkMode,
}));

import { DeckImportPage } from "./DeckImportPage";

const preview = {
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
    mocks.result = undefined;
    mocks.pending = false;
    mocks.validating = false;
    mocks.error = null;
    mocks.previewError = null;
    mocks.storageMode = "remote";
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

  it("forwards the selected import storage mode to the import controller", async () => {
    render(<DeckImportPage />);

    await userEvent.click(screen.getByRole("radio", { name: /Local only/ }));

    expect(mocks.setStorageMode).toHaveBeenCalledExactlyOnceWith("local");
  });

  it("renders the import screen in the application shell", () => {
    render(<DeckImportPage />);

    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();
  });

  it("navigates from top and settings keyboard shortcuts", () => {
    render(<DeckImportPage />);

    fireEvent.keyDown(window, { key: "t" });
    fireEvent.keyDown(window, { key: "s" });

    expect(mocks.navigate).toHaveBeenNthCalledWith(1, "/", undefined);
    expect(mocks.navigate).toHaveBeenNthCalledWith(2, "/settings", undefined);
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
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledExactlyOnceWith("/", undefined));
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
