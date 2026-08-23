import type { Preferences } from "@/entities/preference";
import type { Deck } from "@/entities/deck";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { createDeck as createDeckFixture, createLocalDeck, createPreferences } from "@/test/factories";
import { actAsync } from "@/test/act";

const mocks = vi.hoisted(() => ({
  createCard: vi.fn(),
  deck: undefined as Deck | undefined,
  remoteDecksReady: true,
  preferences: null as unknown as Preferences,
  setDarkMode: vi.fn(),
}));

vi.mock("@/entities/auth", () => ({ useAuthUid: () => "user-id" }));
vi.mock("@/entities/card", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/entities/card")>();
  return { ...original, createCard: mocks.createCard, generateCardId: () => "new-card" };
});
vi.mock("@/entities/deck", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/entities/deck")>();
  return {
    ...original,
    useDeck: () => mocks.deck,
    useRemoteDecksReady: () => mocks.remoteDecksReady,
  };
});
vi.mock("@/entities/preference", () => ({
  usePreferences: () => mocks.preferences,
  setDarkMode: mocks.setDarkMode,
}));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { CardCreatePage } from "./CardCreatePage";

const LeaveRouteButton = () => {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => void navigate("/")}>
      Leave route
    </button>
  );
};

describe("CardCreatePage", () => {
  const localDeck = createLocalDeck({ id: "local-deck", name: "Local deck" });
  const page = (deckId = localDeck.id, routerKey = deckId) => (
    <MemoryRouter key={routerKey} initialEntries={[`/deck/${deckId}/card/new`]}>
      <LeaveRouteButton />
      <Routes>
        <Route path="/" element={<h1>Deck list destination</h1>} />
        <Route path="/deck/:id" element={<h1>Card list destination</h1>} />
        <Route path="/deck/:id/card/new" element={<CardCreatePage />} />
      </Routes>
    </MemoryRouter>
  );
  const renderPage = (deckId = localDeck.id, strictMode = false) =>
    render(strictMode ? <React.StrictMode>{page(deckId)}</React.StrictMode> : page(deckId));

  beforeEach(() => {
    mocks.createCard.mockReset().mockResolvedValue(undefined);
    mocks.deck = localDeck;
    mocks.remoteDecksReady = true;
    mocks.preferences = createPreferences({ appearance: { darkMode: false } });
    mocks.setDarkMode.mockReset();
  });

  it("creates a local Card for a local parent and returns to its Card list under Strict Mode", async () => {
    renderPage(localDeck.id, true);

    await userEvent.type(screen.getByRole("textbox", { name: "Front text" }), "Question");
    await userEvent.type(screen.getByRole("textbox", { name: "Back text" }), "Answer");
    await userEvent.click(screen.getByRole("button", { name: "Add card" }));

    expect(mocks.createCard).toHaveBeenCalledExactlyOnceWith("user-id", {
      id: "new-card",
      deckId: localDeck.id,
      uniqueKey: "new-card",
      frontText: "Question",
      backText: "Answer",
      tags: [],
    });
    expect(await screen.findByRole("heading", { level: 1, name: "Card list destination" })).toBeVisible();
  });

  it("derives a remote Card owner from a remote parent Deck", async () => {
    const remoteDeck = createDeckFixture({ id: "remote-deck", uid: "user-id", name: "Remote deck" });
    mocks.deck = remoteDeck;
    renderPage(remoteDeck.id);

    await userEvent.type(screen.getByRole("textbox", { name: "Front text" }), "Remote question");
    await userEvent.type(screen.getByRole("textbox", { name: "Back text" }), "Remote answer");
    await userEvent.click(screen.getByRole("button", { name: "Add card" }));

    expect(mocks.createCard).toHaveBeenCalledExactlyOnceWith(
      "user-id",
      expect.objectContaining({ deckId: remoteDeck.id, uid: remoteDeck.uid })
    );
  });

  it("does not offer creation when the target Deck is missing", () => {
    mocks.deck = undefined;
    renderPage("missing-deck");

    expect(screen.getByRole("heading", { level: 1, name: "Deck not found" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Add card" })).not.toBeInTheDocument();
    expect(mocks.createCard).not.toHaveBeenCalled();
  });

  it("waits for the first remote snapshot before classifying the target Deck", () => {
    mocks.deck = undefined;
    mocks.remoteDecksReady = false;
    const view = renderPage("delayed-deck");

    expect(screen.getByRole("heading", { level: 1, name: "Loading deck…" })).toBeVisible();

    mocks.deck = createDeckFixture({ id: "delayed-deck", name: "Delayed deck" });
    mocks.remoteDecksReady = true;
    view.rerender(page("delayed-deck", "snapshot-ready"));

    expect(screen.getByRole("heading", { level: 1, name: "Add card" })).toBeVisible();
  });

  it("keeps entered values after failure and allows retry", async () => {
    mocks.createCard.mockRejectedValueOnce(new Error("write failed"));
    renderPage();
    const front = screen.getByRole("textbox", { name: "Front text" });
    const back = screen.getByRole("textbox", { name: "Back text" });

    await userEvent.type(front, "Retry question");
    await userEvent.type(back, "Retry answer");
    await userEvent.click(screen.getByRole("button", { name: "Add card" }));

    expect(await screen.findByText("Unable to create this card. Try again.")).toBeVisible();
    expect(front).toHaveValue("Retry question");
    expect(back).toHaveValue("Retry answer");
    await userEvent.click(screen.getByRole("button", { name: "Add card" }));
    expect(mocks.createCard).toHaveBeenCalledTimes(2);
  });

  it("suppresses a second submit while creation is pending", async () => {
    let resolveCreate: (() => void) | undefined;
    mocks.createCard.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveCreate = resolve;
      })
    );
    renderPage();

    await userEvent.type(screen.getByRole("textbox", { name: "Front text" }), "Pending question");
    await userEvent.type(screen.getByRole("textbox", { name: "Back text" }), "Pending answer");
    const createButton = screen.getByRole("button", { name: "Add card" });
    await userEvent.click(createButton);
    expect(createButton).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Back to cards" })).toBeDisabled();
    fireEvent.click(createButton);

    expect(mocks.createCard).toHaveBeenCalledTimes(1);
    await actAsync(async () => {
      resolveCreate?.();
      await Promise.resolve();
    });
    await waitFor(() => expect(screen.getByRole("heading", { name: "Card list destination" })).toBeVisible());
  });

  it("does not navigate from a write that finishes after the Page unmounts", async () => {
    let resolveCreate: (() => void) | undefined;
    mocks.createCard.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveCreate = resolve;
      })
    );
    renderPage();

    await userEvent.type(screen.getByRole("textbox", { name: "Front text" }), "Slow question");
    await userEvent.type(screen.getByRole("textbox", { name: "Back text" }), "Slow answer");
    await userEvent.click(screen.getByRole("button", { name: "Add card" }));
    await userEvent.click(screen.getByRole("button", { name: "Leave route" }));
    expect(screen.getByRole("heading", { name: "Deck list destination" })).toBeVisible();

    await actAsync(async () => {
      resolveCreate?.();
      await Promise.resolve();
    });

    expect(screen.getByRole("heading", { name: "Deck list destination" })).toBeVisible();
  });
});
