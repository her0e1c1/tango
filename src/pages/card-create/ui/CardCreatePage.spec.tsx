import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { createCard } from "@/entities/card";
import { useDeck } from "@/entities/deck";
import { dismissToast, ToastViewport } from "@/shared/ui/toast";
import { actAsync } from "@/test/act";
import { createDeck as createRemoteDeck, createLocalDeck } from "@/test/factories";

vi.mock("@/entities/auth", () => ({ useAuthUid: () => "user-id" }));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/entities/card", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/card")>()),
  createCard: vi.fn(),
}));
vi.mock("@/entities/deck", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/deck")>()),
  useDeck: vi.fn(),
}));

import { CardCreatePage } from "./CardCreatePage";

const enterRequiredValues = async () => {
  await userEvent.type(screen.getByRole("textbox", { name: "Front text" }), "Front value");
  await userEvent.click(screen.getByRole("tab", { name: "Back" }));
  await userEvent.type(screen.getByRole("textbox", { name: "Back text" }), "Back value");
};

describe("CARD-13 CARD-14 CARD-15 CardCreatePage", () => {
  const deck = createLocalDeck({ id: "target-deck", name: "Target deck" });
  const remoteDeck = createRemoteDeck({ id: "remote-deck", name: "Remote deck" });
  const renderPage = (deckId = deck.id) => {
    const router = createMemoryRouter(
      [
        { path: "/previous", element: <h1>Previous page</h1> },
        { path: "/deck/:id/card/new", element: <CardCreatePage /> },
        { path: "/deck/:id", element: <h1>Card list destination</h1> },
      ],
      { initialEntries: ["/previous", `/deck/${deckId}/card/new`], initialIndex: 1 }
    );
    render(
      <>
        <RouterProvider router={router} />
        <ToastViewport />
      </>
    );
    return { router };
  };

  beforeEach(() => {
    dismissToast();
    vi.mocked(useDeck).mockImplementation((id) => [deck, remoteDeck].find((target) => target.id === id));
    vi.mocked(createCard).mockReset().mockResolvedValue(undefined);
  });

  it("shows the target Deck context and cancels to its Card list", async () => {
    const { router } = renderPage();

    expect(screen.getByText("Add a card to Target deck.")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Card list destination" })).toBeVisible();
    expect(router.state.location.pathname).toBe(`/deck/${deck.id}`);
  });

  it.each([deck, remoteDeck])(
    "creates a Card in $name and keeps its success notification across navigation",
    async (target) => {
      const { router } = renderPage(target.id);
      await enterRequiredValues();

      await userEvent.click(screen.getByRole("button", { name: "Create card" }));

      expect(await screen.findByRole("heading", { level: 1, name: "Card list destination" })).toBeVisible();
      expect(router.state.location.pathname).toBe(`/deck/${target.id}`);
      expect(screen.getByText("Created card “Front value”.")).toBeVisible();
      expect(vi.mocked(createCard).mock.calls).toEqual([
        [
          "user-id",
          {
            id: expect.any(String),
            uniqueKey: expect.any(String),
            deckId: target.id,
            frontText: "Front value",
            backText: "Back value",
            tags: [],
          },
        ],
      ]);
      const createdCard = vi.mocked(createCard).mock.calls[0]?.[1];
      expect(createdCard?.uniqueKey).toBe(createdCard?.id);

      await actAsync(async () => router.navigate(-1));

      expect(screen.getByRole("heading", { level: 1, name: "Previous page" })).toBeVisible();
      expect(screen.getByText("Created card “Front value”.")).toBeVisible();
    }
  );

  it("keeps input and identity when a failed creation is retried", async () => {
    vi.mocked(createCard).mockRejectedValueOnce(new Error("write failed"));
    const { router } = renderPage(remoteDeck.id);
    await enterRequiredValues();

    await userEvent.click(screen.getByRole("button", { name: "Create card" }));

    expect(await screen.findByText("Unable to create this card. Try again.")).toBeVisible();
    const failedCreation = vi.mocked(createCard).mock.calls[0];
    expect(screen.getByRole("textbox", { name: "Back text" })).toHaveValue("Back value");
    await userEvent.click(screen.getByRole("tab", { name: "Front" }));
    expect(screen.getByRole("textbox", { name: "Front text" })).toHaveValue("Front value");

    await userEvent.click(screen.getByRole("button", { name: "Create card" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Card list destination" })).toBeVisible();
    expect(router.state.location.pathname).toBe(`/deck/${remoteDeck.id}`);
    expect(vi.mocked(createCard).mock.calls).toEqual([failedCreation, failedCreation]);
    expect(screen.getByText("Created card “Front value”.")).toBeVisible();
    expect(screen.queryByText("Unable to create this card. Try again.")).not.toBeInTheDocument();
  });

  it("suppresses a second submit while creation is pending", async () => {
    let finishWrite: () => void = () => undefined;
    vi.mocked(createCard).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishWrite = resolve;
        })
    );
    renderPage();
    await enterRequiredValues();
    const createButton = screen.getByRole("button", { name: "Create card" });

    // Both clicks arrive before React commits the disabled state or validation resolves.
    act(() => {
      createButton.click();
      createButton.click();
    });

    await waitFor(() => expect(createCard).toHaveBeenCalledOnce());
    expect(screen.getByRole("button", { name: "Creating…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Back to cards" })).toBeDisabled();
    await actAsync(async () => finishWrite());

    expect(screen.getByRole("heading", { level: 1, name: "Card list destination" })).toBeVisible();
    expect(createCard).toHaveBeenCalledOnce();
  });

  it.each(["success", "failure"])("ignores a late %s after leaving the Page", async (outcome) => {
    let finishWrite: () => void = () => undefined;
    vi.mocked(createCard).mockImplementation(
      () =>
        new Promise<void>((resolve, reject) => {
          finishWrite = () => (outcome === "success" ? resolve() : reject(new Error("write failed")));
        })
    );
    const { router } = renderPage();
    await enterRequiredValues();
    await userEvent.click(screen.getByRole("button", { name: "Create card" }));
    await waitFor(() => expect(createCard).toHaveBeenCalledOnce());
    await actAsync(async () => router.navigate("/previous"));

    await actAsync(async () => finishWrite());

    expect(screen.getByRole("heading", { level: 1, name: "Previous page" })).toBeVisible();
    expect(router.state.location.pathname).toBe("/previous");
    expect(screen.queryByText("Created card “Front value”.")).not.toBeInTheDocument();
    expect(screen.queryByText("Unable to create this card. Try again.")).not.toBeInTheDocument();
  });

  it("shows route recovery when the target Deck is unavailable", () => {
    renderPage("missing-deck");

    expect(screen.getByRole("heading", { level: 1, name: "Deck not found" })).toBeVisible();
  });
});
