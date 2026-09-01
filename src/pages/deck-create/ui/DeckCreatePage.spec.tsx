import type { Preferences } from "@/entities/preference";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { createMemoryRouter, RouterProvider, useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { createPreferences } from "@/test/factories";
import { actAsync } from "@/test/act";
import { dismissToast, ToastViewport } from "@/shared/ui/toast";

const mocks = vi.hoisted(() => ({
  createDeck: vi.fn(),
  generateDeckId: vi.fn(),
  preferences: null as unknown as Preferences,
  setDarkMode: vi.fn(),
}));

vi.mock("@/entities/auth", () => ({ useAuthUid: () => "user-id" }));
vi.mock("@/entities/deck", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/entities/deck")>();
  return { ...original, createDeck: mocks.createDeck, generateDeckId: mocks.generateDeckId };
});
vi.mock("@/entities/preference", () => ({
  usePreferences: () => mocks.preferences,
  setDarkMode: mocks.setDarkMode,
}));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { DeckCreatePage } from "./DeckCreatePage";

const LeaveRouteButton = () => {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => void navigate("/")}>
      Leave route
    </button>
  );
};

describe("DECK-09 DECK-10 DECK-11 DeckCreatePage", () => {
  const renderPage = (strictMode = false) => {
    const router = createMemoryRouter(
      [
        { path: "/", element: <h1>Deck list destination</h1> },
        {
          path: "/deck/new",
          element: (
            <>
              <LeaveRouteButton />
              <DeckCreatePage />
            </>
          ),
        },
        { path: "/deck/:id", element: <h1>Card list destination</h1> },
      ],
      { initialEntries: ["/deck/new"] }
    );
    const page = (
      <>
        <RouterProvider router={router} />
        <ToastViewport />
      </>
    );
    return render(strictMode ? <React.StrictMode>{page}</React.StrictMode> : page);
  };

  beforeEach(() => {
    dismissToast();
    mocks.createDeck.mockReset().mockResolvedValue(undefined);
    mocks.generateDeckId.mockReset().mockReturnValue("new-deck");
    mocks.preferences = createPreferences({ appearance: { darkMode: false } });
    mocks.setDarkMode.mockReset();
  });

  it("creates a remote empty Deck with source settings and opens its Card list under Strict Mode", async () => {
    renderPage(true);

    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "New deck");
    await userEvent.type(screen.getByRole("textbox", { name: "Source URL" }), "https://example.com/deck.csv");
    await userEvent.click(screen.getByRole("checkbox", { name: "Convert line breaks" }));
    await userEvent.click(screen.getByRole("button", { name: "Create deck" }));

    expect(mocks.createDeck).toHaveBeenCalledExactlyOnceWith("user-id", {
      id: "new-deck",
      localMode: false,
      name: "New deck",
      category: "",
      convertToBr: true,
      url: "https://example.com/deck.csv",
    });
    expect(await screen.findByRole("heading", { level: 1, name: "Card list destination" })).toBeVisible();
    expect(screen.getByText("Created deck “New deck”.")).toBeVisible();
  });

  it("creates a local empty Deck without remote ownership fields", async () => {
    renderPage();

    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "Local deck");
    await userEvent.type(screen.getByRole("textbox", { name: "Source URL" }), "https://example.com/local.csv");
    await userEvent.click(screen.getByRole("checkbox", { name: "Convert line breaks" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Local only" }));
    await userEvent.click(screen.getByRole("button", { name: "Create deck" }));

    expect(mocks.createDeck).toHaveBeenCalledExactlyOnceWith("user-id", {
      id: "new-deck",
      localMode: true,
      name: "Local deck",
      category: "",
      convertToBr: true,
      url: "https://example.com/local.csv",
    });
  });

  it("omits an empty optional source URL from the create input", async () => {
    renderPage();

    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "No source deck");
    await userEvent.click(screen.getByRole("button", { name: "Create deck" }));

    expect(mocks.createDeck).toHaveBeenCalledExactlyOnceWith("user-id", {
      id: "new-deck",
      localMode: false,
      name: "No source deck",
      category: "",
      convertToBr: false,
    });
  });

  it("reports a creation failure without locking the form for a special retry flow", async () => {
    mocks.createDeck.mockRejectedValueOnce(new Error("write failed"));
    renderPage();
    const name = screen.getByRole("textbox", { name: "Name" });
    const category = screen.getByRole("combobox");
    const sourceUrl = screen.getByRole("textbox", { name: "Source URL" });
    const convertLineBreaks = screen.getByRole("checkbox", { name: "Convert line breaks" });

    await userEvent.type(name, "Failed deck");
    await userEvent.selectOptions(category, "typescript");
    await userEvent.type(sourceUrl, "https://example.com/failed.csv");
    await userEvent.click(convertLineBreaks);
    await userEvent.click(screen.getByRole("button", { name: "Create deck" }));

    expect(await screen.findByText("Unable to create this deck.")).toBeVisible();
    expect(name).toHaveValue("Failed deck");
    expect(category).toHaveValue("typescript");
    expect(sourceUrl).toHaveValue("https://example.com/failed.csv");
    expect(convertLineBreaks).toBeChecked();
    const localMode = screen.getByRole("checkbox", { name: "Local only" });
    expect(localMode).toBeEnabled();
    expect(localMode).not.toBeChecked();
    await userEvent.click(localMode);
    expect(localMode).toBeChecked();
    expect(mocks.generateDeckId).toHaveBeenCalledOnce();
    expect(mocks.createDeck).toHaveBeenCalledExactlyOnceWith("user-id", {
      id: "new-deck",
      localMode: false,
      name: "Failed deck",
      category: "typescript",
      convertToBr: true,
      url: "https://example.com/failed.csv",
    });
  });

  it("dismisses a failed creation notification when cancelled", async () => {
    mocks.createDeck.mockRejectedValueOnce(new Error("write failed"));
    renderPage();

    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "Cancelled deck");
    await userEvent.click(screen.getByRole("button", { name: "Create deck" }));
    expect(await screen.findByText("Unable to create this deck.")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByText("Unable to create this deck.")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(await screen.findByRole("heading", { name: "Deck list destination" })).toBeVisible();
  });

  it("suppresses a second submit while creation is pending", async () => {
    let resolveCreate: (() => void) | undefined;
    mocks.createDeck.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveCreate = resolve;
      })
    );
    renderPage();

    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "Pending deck");
    const createButton = screen.getByRole("button", { name: "Create deck" });
    await userEvent.click(createButton);
    expect(createButton).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Back to decks" })).toBeDisabled();
    fireEvent.click(createButton);

    expect(mocks.createDeck).toHaveBeenCalledTimes(1);
    await actAsync(async () => {
      resolveCreate?.();
      await Promise.resolve();
    });
    await waitFor(() => expect(screen.getByRole("heading", { name: "Card list destination" })).toBeVisible());
  });

  it("does not navigate from a write that finishes after the Page unmounts", async () => {
    let resolveCreate: (() => void) | undefined;
    mocks.createDeck.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveCreate = resolve;
      })
    );
    renderPage();

    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "Slow deck");
    await userEvent.click(screen.getByRole("button", { name: "Create deck" }));
    await userEvent.click(screen.getByRole("button", { name: "Leave route" }));
    await userEvent.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(screen.getByRole("heading", { name: "Deck list destination" })).toBeVisible();
    expect(screen.queryByText("Created deck “Slow deck”.")).not.toBeInTheDocument();

    await actAsync(async () => {
      resolveCreate?.();
      await Promise.resolve();
    });

    expect(screen.getByRole("heading", { name: "Deck list destination" })).toBeVisible();
  });

  it("returns to the Deck list without creating", async () => {
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(await screen.findByRole("heading", { name: "Deck list destination" })).toBeVisible();
    expect(mocks.createDeck).not.toHaveBeenCalled();
  });

  it("keeps dirty input or discards it before cancellation", async () => {
    renderPage();
    const name = screen.getByRole("textbox", { name: "Name" });
    await userEvent.type(name, "Unsaved deck");

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await userEvent.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(name).toHaveValue("Unsaved deck");

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await userEvent.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(await screen.findByRole("heading", { name: "Deck list destination" })).toBeVisible();
  });
});
