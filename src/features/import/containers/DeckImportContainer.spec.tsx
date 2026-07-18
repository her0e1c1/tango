import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  importFile: vi.fn(),
  addSample: vi.fn(),
  navigate: vi.fn(),
  deckDownloadCsvSampleText: vi.fn(),
  goToTop: vi.fn(),
  goToSettings: vi.fn(),
  useKey: vi.fn(),
}));

vi.mock("react-router-dom", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("@/features/import/hooks/useDeckImport", () => ({
  useDeckImport: () => ({
    importFile: mocks.importFile,
    addSample: mocks.addSample,
    pending: false,
    error: null,
    retry: vi.fn(),
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

describe("DeckImportContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.importFile.mockResolvedValue({});
    mocks.addSample.mockResolvedValue({});
  });

  afterEach(() => {
    cleanup();
  });

  it("wires CSV upload, sample download, and navigation shortcuts", async () => {
    const view = render(<DeckImportContainer />);
    const file = new File(["front,back"], "deck.csv", { type: "text/csv" });

    fireEvent.change(view.container.querySelector("input[type='file']") as Element, {
      target: { files: [file] },
    });
    await userEvent.click(view.getByText("download"));

    expect(mocks.importFile).toHaveBeenCalledWith(file);
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith(-1));
    expect(mocks.deckDownloadCsvSampleText).toHaveBeenCalledOnce();
    expect(mocks.useKey).toHaveBeenCalledWith("t", mocks.goToTop);
    expect(mocks.useKey).toHaveBeenCalledWith("s", mocks.goToSettings);
  });

  it("adds the bundled sample through the import operation", async () => {
    const view = render(<DeckImportContainer />);

    await userEvent.click(view.getByRole("button", { name: "Add sample deck" }));

    expect(mocks.addSample).toHaveBeenCalledOnce();
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith(-1));
  });
});
