import type { Preferences } from "@/entities/preference";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { createMemoryRouter, RouterProvider, useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { createDeck as createDeckFixture, createPreferences } from "@/test/factories";
import { replaceRemoteDecks } from "@/test/entityFixtures";
import { actAsync } from "@/test/act";
import { dismissToast, ToastViewport } from "@/shared/ui/toast";

const mocks = vi.hoisted(() => ({
  uid: "user-id",
  createDeck: vi.fn(),
  generateId: vi.fn(),
  preferences: null as unknown as Preferences,
  setDarkMode: vi.fn(),
}));

vi.mock("@/entities/auth", () => ({
  getAuthUid: () => mocks.uid,
  useAuth: () => ({ isAnonymous: mocks.uid === "" }),
}));
vi.mock("@/entities/deck", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/entities/deck")>();
  return { ...original, createDeck: mocks.createDeck };
});
vi.mock("@/shared/lib/generateId", () => ({ generateId: mocks.generateId }));
vi.mock("@/entities/preference", () => ({
  usePreferences: () => mocks.preferences,
  setDarkMode: mocks.setDarkMode,
}));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { DeckCreatePage } from "./DeckCreatePage";

type CreateDeckInput = Parameters<typeof import("@/entities/deck").createDeck>[1];

const publishDeck = (uid: string, input: CreateDeckInput) => {
  replaceRemoteDecks([createDeckFixture({ id: input.id, name: input.name, uid })]);
};

const LeaveRouteButton = () => {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => void navigate("/")}>
      Leave route
    </button>
  );
};

describe("DECK-MANAGEMENT-05 DECK-MANAGEMENT-06 DECK-MANAGEMENT-07 DeckCreatePage", () => {
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
    return { ...render(strictMode ? <React.StrictMode>{page}</React.StrictMode> : page), router };
  };

  beforeEach(() => {
    dismissToast();
    mocks.uid = "user-id";
    mocks.createDeck.mockReset().mockImplementation(async (uid: string, input: CreateDeckInput) => {
      await Promise.resolve();
      publishDeck(uid, input);
    });
    mocks.generateId.mockReset().mockReturnValue("new-deck");
    mocks.preferences = createPreferences({ appearance: { darkMode: false } });
    mocks.setDarkMode.mockReset();
  });

  it("creates a remote empty Deck with source settings and opens its Card list under Strict Mode", async () => {
    renderPage(true);
    await userEvent.click(screen.getByText("More settings"));

    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "New deck");
    await userEvent.type(screen.getByRole("textbox", { name: "Source URL" }), "https://example.com/deck.csv");
    await userEvent.click(screen.getByRole("checkbox", { name: "Convert line breaks" }));
    await userEvent.click(screen.getByRole("button", { name: "Create deck" }));

    expect(mocks.createDeck).toHaveBeenCalledExactlyOnceWith("user-id", {
      id: "new-deck",

      name: "New deck",
      category: "",
      convertToBr: true,
      url: "https://example.com/deck.csv",
    });
    expect(await screen.findByRole("heading", { level: 1, name: "Card list destination" })).toBeVisible();
    expect(screen.getByText("Created deck “New deck”.")).toBeVisible();
  });

  it("creates an anonymous Deck without a destination selector", async () => {
    mocks.uid = "anonymous";
    renderPage();
    await userEvent.click(screen.getByText("More settings"));

    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "Local deck");
    await userEvent.type(screen.getByRole("textbox", { name: "Source URL" }), "https://example.com/local.csv");
    await userEvent.click(screen.getByRole("checkbox", { name: "Convert line breaks" }));
    await userEvent.click(screen.getByRole("button", { name: "Create deck" }));

    expect(mocks.createDeck).toHaveBeenCalledExactlyOnceWith("anonymous", {
      id: "new-deck",

      name: "Local deck",
      category: "",
      convertToBr: true,
      url: "https://example.com/local.csv",
    });
  });

  it("uses the current anonymous UID after signing out", async () => {
    renderPage();
    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "Signed-out deck");
    mocks.uid = "anonymous";

    await userEvent.click(screen.getByRole("button", { name: "Create deck" }));

    expect(mocks.createDeck).toHaveBeenCalledExactlyOnceWith(
      "anonymous",
      expect.objectContaining({
        name: "Signed-out deck",
      })
    );
  });

  it("omits an empty optional source URL from the create input", async () => {
    renderPage();

    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "No source deck");
    await userEvent.click(screen.getByRole("button", { name: "Create deck" }));

    expect(mocks.createDeck).toHaveBeenCalledExactlyOnceWith("user-id", {
      id: "new-deck",

      name: "No source deck",
      category: "",
      convertToBr: false,
    });
  });

  it("reports a creation failure without locking the form for a special retry flow", async () => {
    mocks.createDeck.mockRejectedValueOnce(new Error("write failed"));
    renderPage();
    await userEvent.click(screen.getByText("More settings"));
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
    expect(mocks.generateId).toHaveBeenCalledOnce();
    expect(mocks.createDeck).toHaveBeenCalledExactlyOnceWith("user-id", {
      id: "new-deck",

      name: "Failed deck",
      category: "typescript",
      convertToBr: true,
      url: "https://example.com/failed.csv",
    });
  });

  it("keeps a failed creation notification during retry and replaces it on success", async () => {
    const retry = Promise.withResolvers<void>();
    mocks.createDeck
      .mockRejectedValueOnce(new Error("write failed"))
      .mockImplementationOnce(async (uid: string, input: CreateDeckInput) => {
        await retry.promise;
        publishDeck(uid, input);
      });
    renderPage();

    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "Retried deck");
    await userEvent.click(screen.getByRole("button", { name: "Create deck" }));
    expect(await screen.findByText("Unable to create this deck.")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Create deck" }));
    expect(screen.getByRole("button", { name: "Create deck" })).toBeDisabled();
    expect(screen.getByText("Unable to create this deck.")).toBeVisible();

    await actAsync(async () => {
      retry.resolve();
      await Promise.resolve();
    });

    expect(await screen.findByRole("heading", { name: "Card list destination" })).toBeVisible();
    expect(screen.getByText("Created deck “Retried deck”.")).toBeVisible();
    expect(screen.queryByText("Unable to create this deck.")).not.toBeInTheDocument();
  });

  it.each(["Back to decks", "Leave route"])(
    "keeps a failed creation notification when leaving via %s and re-entering",
    async (leaveButton) => {
      mocks.createDeck.mockRejectedValueOnce(new Error("write failed"));
      const { router } = renderPage();

      await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "Cancelled deck");
      await userEvent.click(screen.getByRole("button", { name: "Create deck" }));
      expect(await screen.findByText("Unable to create this deck.")).toBeVisible();

      await userEvent.click(screen.getByRole("button", { name: leaveButton }));
      expect(screen.getByText("Unable to create this deck.")).toBeVisible();
      await userEvent.click(screen.getByRole("button", { name: "Discard changes" }));
      expect(await screen.findByRole("heading", { name: "Deck list destination" })).toBeVisible();
      expect(screen.getByText("Unable to create this deck.")).toBeVisible();

      await actAsync(async () => {
        await router.navigate("/deck/new");
      });
      expect(screen.getByRole("button", { name: "Create deck" })).toBeVisible();
      expect(screen.getByText("Unable to create this deck.")).toBeVisible();
    }
  );

  it("suppresses a second submit while creation is pending", async () => {
    let resolveCreate: (() => void) | undefined;
    mocks.createDeck.mockImplementation(
      (uid: string, input: CreateDeckInput) =>
        new Promise<void>((resolve) => {
          resolveCreate = () => {
            publishDeck(uid, input);
            resolve();
          };
        })
    );
    renderPage();

    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "Pending deck");
    const createButton = screen.getByRole("button", { name: "Create deck" });
    await userEvent.click(createButton);
    expect(createButton).toBeDisabled();
    expect(screen.getByRole("button", { name: "Back to decks" })).toBeDisabled();
    fireEvent.click(createButton);

    expect(mocks.createDeck).toHaveBeenCalledTimes(1);
    await actAsync(async () => {
      resolveCreate?.();
      await Promise.resolve();
    });
    await waitFor(() => expect(screen.getByRole("heading", { name: "Card list destination" })).toBeVisible());
  });

  it.each(["success", "failure"] as const)("does not publish a late %s after leaving the Page", async (outcome) => {
    const write = Promise.withResolvers<void>();
    mocks.createDeck.mockImplementationOnce(async (uid: string, input: CreateDeckInput) => {
      await write.promise;
      publishDeck(uid, input);
    });
    renderPage(true);

    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "Slow deck");
    await userEvent.click(screen.getByRole("button", { name: "Create deck" }));
    await userEvent.click(screen.getByRole("button", { name: "Leave route" }));
    await userEvent.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(screen.getByRole("heading", { name: "Deck list destination" })).toBeVisible();

    await actAsync(async () => {
      if (outcome === "success") write.resolve();
      else write.reject(new Error("write failed"));
      await Promise.resolve();
    });

    expect(screen.getByRole("heading", { name: "Deck list destination" })).toBeVisible();
    expect(screen.queryByText("Created deck “Slow deck”.")).not.toBeInTheDocument();
    expect(screen.queryByText("Unable to create this deck.")).not.toBeInTheDocument();
  });

  it.each(["success", "failure"] as const)("isolates an old %s after re-entering the Page", async (outcome) => {
    const oldWrite = Promise.withResolvers<void>();
    const newWrite = Promise.withResolvers<void>();
    mocks.createDeck
      .mockImplementationOnce(async (uid: string, input: CreateDeckInput) => {
        await oldWrite.promise;
        publishDeck(uid, input);
      })
      .mockImplementationOnce(async (uid: string, input: CreateDeckInput) => {
        await newWrite.promise;
        publishDeck(uid, input);
      });
    const { unmount } = renderPage(true);
    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "Old deck");
    await userEvent.click(screen.getByRole("button", { name: "Create deck" }));
    unmount();

    renderPage(true);
    await userEvent.click(screen.getByText("More settings"));
    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "Current deck");
    await userEvent.click(screen.getByRole("button", { name: "Create deck" }));
    await actAsync(async () => {
      if (outcome === "success") oldWrite.resolve();
      else oldWrite.reject(new Error("old write failed"));
      await Promise.resolve();
    });

    expect(screen.queryByText("Created deck “Old deck”.")).not.toBeInTheDocument();
    expect(screen.queryByText("Unable to create this deck.")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Current deck");
    expect(screen.getByRole("button", { name: "Create deck" })).toBeDisabled();

    await actAsync(async () => {
      newWrite.resolve();
      await Promise.resolve();
    });
    expect(await screen.findByRole("heading", { name: "Card list destination" })).toBeVisible();
    expect(screen.getByText("Created deck “Current deck”.")).toBeVisible();
  });

  it("returns to the Deck list without creating", async () => {
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Back to decks" }));

    expect(await screen.findByRole("heading", { name: "Deck list destination" })).toBeVisible();
    expect(mocks.createDeck).not.toHaveBeenCalled();
  });

  it("keeps dirty input or discards it before cancellation", async () => {
    renderPage();
    const name = screen.getByRole("textbox", { name: "Name" });
    await userEvent.type(name, "Unsaved deck");

    await userEvent.click(screen.getByRole("button", { name: "Back to decks" }));
    await userEvent.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(name).toHaveValue("Unsaved deck");

    await userEvent.click(screen.getByRole("button", { name: "Back to decks" }));
    await userEvent.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(await screen.findByRole("heading", { name: "Deck list destination" })).toBeVisible();
  });
});
