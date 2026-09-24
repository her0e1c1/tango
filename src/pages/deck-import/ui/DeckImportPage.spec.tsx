import "@/test/mockFirestorePersistence";
import { getI18n } from "react-i18next";
import { selectDeckImportFile } from "../model/actions/selectDeckImportFile";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { useCards } from "@/entities/card";
import { useDecks } from "@/entities/deck";
import { dismissToast, ToastViewport } from "@/shared/ui/toast";
import { actAsync } from "@/test/act";

const controls = vi.hoisted(() => ({
  nextMutationError: undefined as unknown,
  nextMutationWait: undefined as Promise<void> | undefined,
  setDarkMode: vi.fn(),
}));

vi.mock("@/entities/auth", () => ({
  getAuthSession: () => ({ status: "anonymous" }),
  getAuthUid: () => "user-id",
  useAuth: () => ({ isAnonymous: true }),
}));
vi.mock("@/entities/card", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/card")>();
  return {
    ...actual,
    mutateCards: async (...arguments_: Parameters<typeof actual.mutateCards>) => {
      const wait = controls.nextMutationWait;
      controls.nextMutationWait = undefined;
      if (wait !== undefined) await wait;
      if (controls.nextMutationError !== undefined) {
        const error = controls.nextMutationError;
        controls.nextMutationError = undefined;
        throw error;
      }
      return actual.mutateCards(...arguments_);
    },
  };
});
vi.mock("@/entities/preference", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/preference")>();
  return {
    ...actual,
    usePreferences: () => ({ appearance: { darkMode: false } }),
    setDarkMode: controls.setDarkMode,
  };
});
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { deckImportStore } from "../model/store";

import { DeckImportPage } from "./DeckImportPage";

const DeckListDestination = () => {
  const decks = useDecks();
  const cards = useCards();
  return (
    <>
      <h1>Deck list destination</h1>
      {decks.map((deck) => (
        <p key={deck.id}>{deck.name}</p>
      ))}
      {cards.map((card) => (
        <p key={card.id}>{`${card.frontText}: ${card.backText}`}</p>
      ))}
    </>
  );
};

const renderPage = () =>
  render(
    <>
      <MemoryRouter initialEntries={["/previous", "/import"]} initialIndex={1}>
        <Routes>
          <Route path="/previous" element={<h1>Previous page</h1>} />
          <Route path="/" element={<DeckListDestination />} />
          <Route path="/settings" element={<h1>Settings destination</h1>} />
          <Route path="/import" element={<DeckImportPage />} />
        </Routes>
      </MemoryRouter>
      <ToastViewport />
    </>
  );

const selectLocalFile = async (name: string, backText = "back") => {
  fireEvent.change(screen.getByLabelText("Upload a csv file"), {
    target: {
      files: [new File([`"front","${backText}","tag","key"`], name, { type: "text/csv" })],
    },
  });
  await screen.findByRole("heading", { level: 2, name: "Review import" });
};

describe("DeckImportPage [DECK-IMPORT-01 DECK-IMPORT-04 DECK-IMPORT-05 DECK-IMPORT-06 SETTINGS-09]", () => {
  beforeEach(() => {
    deckImportStore.setState(deckImportStore.getInitialState(), true);
    dismissToast();
    controls.nextMutationError = undefined;
    controls.nextMutationWait = undefined;
    controls.setDarkMode.mockReset();
  });

  it("has no destination selector for anonymous imports", () => {
    renderPage();
    expect(screen.queryByRole("radio", { name: /Local only/ })).not.toBeInTheDocument();
  });

  it("translates cached CSV diagnostics without reading again or changing the selected source", async () => {
    renderPage();
    const file = new File([], "日本語.csv", { type: "text/csv" });
    Object.defineProperty(file, "arrayBuffer", {
      value: vi
        .fn()
        .mockResolvedValue(new TextEncoder().encode('問題,回答,個人タグ,key-1\n,,,key-2\n"unterminated').buffer),
    });
    await actAsync(() => selectDeckImportFile(file));
    expect(screen.getByRole("alert")).toHaveTextContent("Front text is required.");
    const source = deckImportStore.getState().source;
    await actAsync(() => getI18n().changeLanguage("ja"));
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("表面のテキストは必須です。");
    expect(alert).toHaveTextContent("裏面のテキストは必須です。");
    expect(alert).toHaveTextContent("引用符で囲まれたフィールドが閉じられていません。");
    expect(within(alert).getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByText("有効: 1件")).toBeVisible();
    expect(screen.getByText("無効: 2件")).toBeVisible();
    expect(screen.getByText("問題", { exact: true })).toBeVisible();
    expect(screen.getByRole("button", { name: "1枚のカードを追加" })).toBeDisabled();
    expect(deckImportStore.getState().source).toBe(source);
    expect(file.arrayBuffer).toHaveBeenCalledOnce();
  });

  it("localizes invalid UTF-8 and recovers with a valid file", async () => {
    renderPage();
    await selectLocalFile("previous.csv");
    await userEvent.click(screen.getByRole("button", { name: "Choose file or example" }));
    fireEvent.change(screen.getByLabelText("Upload a csv file"), {
      target: { files: [new File([new Uint8Array([0x82, 0xa0, 44, 98, 44, 44, 107])], "invalid.csv")] },
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This CSV cannot be read as UTF-8. Save it as UTF-8 and select it again."
    );
    expect(screen.queryByRole("button", { name: "Add 1 card" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Upload a csv file")).toBeEnabled();
    await actAsync(() => getI18n().changeLanguage("ja"));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "このCSVはUTF-8として読み取れません。UTF-8で保存し直して、もう一度選択してください。"
    );
    await actAsync(() => getI18n().changeLanguage("en"));
    await selectLocalFile("recovered.csv", "日本語�");
    await userEvent.click(screen.getByRole("button", { name: "Add 1 card" }));
    expect(await screen.findByText("front: 日本語�")).toBeVisible();
  });

  it("retains prepared import identities when the preview language changes", async () => {
    renderPage();
    await selectLocalFile("language.csv", "回答");
    const source = deckImportStore.getState().source;
    await actAsync(() => getI18n().changeLanguage("ja"));
    expect(deckImportStore.getState().source).toBe(source);
    expect(screen.getByRole("button", { name: "1枚のカードを追加" })).toBeEnabled();
    await userEvent.click(screen.getByRole("button", { name: "1枚のカードを追加" }));
    expect(await screen.findByRole("heading", { name: "Deck list destination" })).toBeVisible();
    expect(screen.getByText("front: 回答")).toBeVisible();
  });

  it("renders the import screen in the application shell", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "Add a deck" })).toBeVisible();
    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();
  });

  it.each([
    { key: "t", destination: "Deck list destination" },
    { key: "s", destination: "Settings destination" },
  ])("opens $destination with the $key shortcut", ({ key, destination }) => {
    renderPage();

    fireEvent.keyDown(window, { key });

    expect(screen.getByRole("heading", { level: 1, name: destination })).toBeVisible();
  });

  it("saves a reviewed local CSV before navigating to the Deck list", async () => {
    const name = "page-behavior-import.csv";
    renderPage();

    await selectLocalFile(name, "saved back");

    expect(screen.getByText("1 valid")).toBeVisible();
    expect(screen.queryByRole("heading", { level: 1, name: "Deck list destination" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Add 1 card" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Deck list destination" })).toBeVisible();
    expect(screen.getByText(name)).toBeVisible();
    expect(screen.getByText("front: saved back")).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("Imported 1 card.");
  });

  it("shows a failed save in place and retries the same import", async () => {
    const name = "page-behavior-retry.csv";
    renderPage();
    await selectLocalFile(name, "retry back");
    controls.nextMutationError = new Error("card mutation failed");

    await userEvent.click(screen.getByRole("button", { name: "Add 1 card" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Import failed. The import could not be completed.");
    expect(screen.getByRole("heading", { level: 1, name: "Add a deck" })).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Add 1 card" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Deck list destination" })).toBeVisible();
    expect(screen.getByText(name)).toBeVisible();
    expect(screen.getByText("front: retry back")).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("Imported 1 card.");
  });

  it("reviews the sample deck and waits for the common save before navigating", async () => {
    const request = Promise.withResolvers<void>();
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Sample deck" }));
    await userEvent.click(screen.getByRole("button", { name: "Try this example" }));
    expect(await screen.findByRole("heading", { name: "Review import" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Deck list destination" })).not.toBeInTheDocument();
    controls.nextMutationWait = request.promise;
    await userEvent.click(screen.getByRole("button", { name: "Add 11 cards" }));
    expect(screen.getByRole("button", { name: "Add 11 cards" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Add 11 cards" })).toHaveAttribute("aria-busy", "true");
    request.resolve();
    expect(await screen.findByRole("heading", { name: "Deck list destination" })).toBeVisible();
    expect(screen.getByText("deck-sample.csv")).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("Imported 11 cards.");
  });

  it("preserves an App-owned import failure when leaving the import page", async () => {
    renderPage();
    await selectLocalFile("page-behavior-leave.csv");
    controls.nextMutationError = new Error("card mutation failed");
    await userEvent.click(screen.getByRole("button", { name: "Add 1 card" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Import failed. The import could not be completed.");

    fireEvent.keyDown(window, { key: "s" });

    expect(screen.getByRole("heading", { level: 1, name: "Settings destination" })).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent("Import failed.");
  });

  it("shows an App-owned import failure that arrives after leaving the import page", async () => {
    const request = Promise.withResolvers<void>();
    renderPage();
    await selectLocalFile("page-behavior-late-failure.csv");
    controls.nextMutationWait = request.promise;
    controls.nextMutationError = new Error("late card mutation failure");
    await userEvent.click(screen.getByRole("button", { name: "Add 1 card" }));

    fireEvent.keyDown(window, { key: "s" });
    expect(screen.getByRole("heading", { level: 1, name: "Settings destination" })).toBeVisible();
    await actAsync(async () => {
      request.resolve();
      await request.promise;
      await Promise.resolve();
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Import failed.");
  });
});
