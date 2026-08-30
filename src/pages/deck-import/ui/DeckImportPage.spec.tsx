import { fireEvent, render, screen } from "@testing-library/react";
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

vi.mock("@/entities/auth", () => ({ useAuthUid: () => "" }));
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
  await userEvent.click(screen.getByRole("radio", { name: /Local only/ }));
  fireEvent.change(screen.getByLabelText("Upload a csv file"), {
    target: {
      files: [new File([`"front","${backText}","tag","key"`], name, { type: "text/csv" })],
    },
  });
  await screen.findByRole("heading", { level: 2, name: "Review import" });
};

describe("DeckImportPage", () => {
  beforeEach(() => {
    dismissToast();
    controls.nextMutationError = undefined;
    controls.nextMutationWait = undefined;
    controls.setDarkMode.mockReset();
  });

  it("renders the import screen in the application shell", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "Import decks" })).toBeVisible();
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
    await userEvent.click(screen.getByRole("button", { name: "Import" }));

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

    await userEvent.click(screen.getByRole("button", { name: "Import" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Import failed. card mutation failed");
    expect(screen.getByRole("heading", { level: 1, name: "Import decks" })).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Import" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Deck list destination" })).toBeVisible();
    expect(screen.getByText(name)).toBeVisible();
    expect(screen.getByText("front: retry back")).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("Imported 1 card.");
  });

  it("loads the sample action, saves the Sample Deck, and navigates without a preview", async () => {
    const request = Promise.withResolvers<void>();
    controls.nextMutationWait = request.promise;
    renderPage();

    const addSample = screen.getByRole("button", { name: "Add sample deck" });
    await userEvent.click(addSample);

    expect(addSample).toBeDisabled();
    expect(addSample).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByRole("heading", { level: 2, name: "Review import" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Import decks" })).toBeVisible();

    request.resolve();

    expect(await screen.findByRole("heading", { level: 1, name: "Deck list destination" })).toBeVisible();
    expect(screen.getByText("Sample Deck")).toBeVisible();
    expect(screen.getAllByText(/: /u).length).toBeGreaterThan(0);
    expect(screen.getByRole("status")).toHaveTextContent(/Added sample deck with \d+ cards?\./u);
  });

  it("shows a failed sample add in place", async () => {
    renderPage();
    controls.nextMutationError = new Error("sample mutation failed");

    await userEvent.click(screen.getByRole("button", { name: "Add sample deck" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to add sample deck. sample mutation failed");
    expect(screen.getByRole("heading", { level: 1, name: "Import decks" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Add sample deck" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Add sample deck" })).not.toHaveAttribute("aria-busy");
  });

  it("dismisses an import failure when leaving the import page", async () => {
    renderPage();
    await selectLocalFile("page-behavior-leave.csv");
    controls.nextMutationError = new Error("card mutation failed");
    await userEvent.click(screen.getByRole("button", { name: "Import" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Import failed. card mutation failed");

    fireEvent.keyDown(window, { key: "s" });

    expect(screen.getByRole("heading", { level: 1, name: "Settings destination" })).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("does not show an import failure that arrives after leaving the import page", async () => {
    const request = Promise.withResolvers<void>();
    renderPage();
    await selectLocalFile("page-behavior-late-failure.csv");
    controls.nextMutationWait = request.promise;
    controls.nextMutationError = new Error("late card mutation failure");
    await userEvent.click(screen.getByRole("button", { name: "Import" }));

    fireEvent.keyDown(window, { key: "s" });
    expect(screen.getByRole("heading", { level: 1, name: "Settings destination" })).toBeVisible();
    await actAsync(async () => {
      request.resolve();
      await request.promise;
      await Promise.resolve();
    });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
