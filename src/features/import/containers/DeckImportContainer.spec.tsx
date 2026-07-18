import { cleanup, fireEvent, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { DeckImportPreview, DeckImportResult } from "@/features/import/components/deckImportTypes";

const mocks = vi.hoisted(() => ({
  selectFile: vi.fn(),
  importPreview: vi.fn(),
  addSample: vi.fn(),
  retry: vi.fn(),
  navigate: vi.fn(),
  deckDownloadCsvSampleText: vi.fn(),
  goToTop: vi.fn(),
  goToSettings: vi.fn(),
  useKey: vi.fn(),
  preview: undefined as DeckImportPreview | undefined,
  data: undefined as DeckImportResult | undefined,
  partialResult: undefined as DeckImportResult | undefined,
  pending: false,
  validating: false,
  error: null as unknown,
}));

vi.mock("react-router-dom", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("@/features/import/hooks/useDeckImport", () => ({
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
    goByMenu: vi.fn(),
    setDarkMode: vi.fn(),
  }),
}));

import { DeckImportContainer } from "@/features/import/containers/DeckImportContainer";

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

describe("DeckImportContainer", () => {
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
    const view = render(<DeckImportContainer />);
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

  it("adds the bundled sample without navigating automatically", async () => {
    const view = render(<DeckImportContainer />);

    await userEvent.click(view.getByRole("button", { name: "Add sample deck" }));

    expect(mocks.addSample).toHaveBeenCalledOnce();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("imports the preview explicitly and navigates only from Back to decks", async () => {
    mocks.preview = preview;
    mocks.data = { created: 1, updated: 0, skipped: 0, failed: 0, deckId: "deck" };
    const view = render(<DeckImportContainer />);

    await userEvent.click(view.getByRole("button", { name: "Import" }));

    expect(mocks.importPreview).toHaveBeenCalledOnce();
    expect(mocks.navigate).not.toHaveBeenCalled();

    await userEvent.click(view.getByRole("button", { name: "Back to decks" }));

    expect(mocks.navigate).toHaveBeenCalledWith(-1);
  });
});
