import "@/test/mockFirestorePersistence";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider, useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { createDeck } from "@/entities/deck";
import { replaceRemoteCards, replaceRemoteDecks } from "@/test/utils/entityFixtures";
import { getCards } from "@/entities/card";
import { ToastViewport } from "@/shared/ui/toast";
import { dismissToast } from "@/test/utils/toast";
import { actAsync } from "@/test/act";
import { createLocalCard, createLocalDeck } from "@/test/factories";

const writes = vi.hoisted(() => ({
  rejected: false,
  pending: null as Promise<void> | null,
}));

vi.mock("@/entities/auth", () => ({ getAuthUid: () => "user-id" }));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/entities/card", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/entities/card")>();
  return {
    ...original,
    createCard: async (...args: Parameters<typeof original.createCard>) => {
      if (writes.pending) await writes.pending;
      if (writes.rejected) throw new Error("write rejected");
      await original.createCard(...args);
    },
  };
});

import { CardCreatePage } from "./CardCreatePage";

const LeaveRouteButton = () => {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => void navigate("/")}>
      Leave route
    </button>
  );
};

describe("CARD-MANAGEMENT-05 CARD-MANAGEMENT-06 CARD-MANAGEMENT-07 CARD-MANAGEMENT-11 CARD-MANAGEMENT-12 CARD-MANAGEMENT-13 CARD-MANAGEMENT-14 CardCreatePage", () => {
  const deck = createLocalDeck({ id: "target-deck", name: "Target deck" });
  const renderPage = (deckId = deck.id) => {
    const router = createMemoryRouter(
      [
        { path: "/", element: <h1>Deck list destination</h1> },
        {
          path: "/deck/:id/card/new",
          element: (
            <>
              <LeaveRouteButton />
              <CardCreatePage />
            </>
          ),
        },
        { path: "/deck/:id", element: <h1>Card list destination</h1> },
      ],
      { initialEntries: [`/deck/${deckId}/card/new`] }
    );
    const view = render(
      <>
        <RouterProvider router={router} />
        <ToastViewport />
      </>
    );
    return Object.assign(view, { router });
  };

  beforeEach(async () => {
    // Given: Establish the shared setup used by the following cases.
    replaceRemoteCards([]);
    dismissToast();
    writes.rejected = false;
    writes.pending = null;
    await createDeck("user-id", deck);
  });

  it("shows the target Deck context and cancels to its Card list when clean", async () => {
    // Given: Use this case's inputs and any shared test setup.
    renderPage();

    expect(screen.getByText("Add a card to Target deck.")).toBeVisible();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { level: 1, name: "Card list destination" })).toBeVisible();
  });

  it("creates a Card and keeps its success notification across navigation", async () => {
    // Given: Use this case's inputs and any shared test setup.
    renderPage();

    // When: Exercise `userEvent.type` with the prepared inputs.
    await userEvent.type(screen.getByRole("textbox", { name: "Front text" }), "Created front");
    await userEvent.click(screen.getByRole("tab", { name: "Back" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Back text" }), "Created back");
    await userEvent.click(screen.getByRole("button", { name: "Create card" }));

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { level: 1, name: "Card list destination" })).toBeVisible();
    expect(screen.getByText("Created card “Created front”.")).toBeVisible();
  });

  it("CARD-MANAGEMENT-05 creates a Card with tags from Cards in the same Deck", async () => {
    // Given: Use this case's inputs and any shared test setup.
    replaceRemoteDecks([deck, createLocalDeck({ id: "other-deck" })]);
    replaceRemoteCards([
      createLocalCard({ id: "source", deckId: deck.id, tags: ["chapter-1", "exam"] }),
      createLocalCard({ id: "other", deckId: "other-deck", tags: ["other-only"] }),
    ]);
    renderPage();
    // When: Exercise `userEvent.type` with the prepared inputs.
    await userEvent.type(screen.getByRole("textbox", { name: "Front text" }), "Tagged front");
    await userEvent.click(screen.getByRole("tab", { name: "Back" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Back text" }), "Tagged back");
    await userEvent.click(screen.getByRole("button", { name: "Edit tags" }));

    // Then: Verify the expected result in the assertions below.
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    expect(screen.queryByRole("checkbox", { name: "math" })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "other-only" })).not.toBeInTheDocument();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("checkbox", { name: "chapter-1" }));
    await userEvent.click(screen.getByRole("button", { name: "Add tag" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Tag name 2" }), " new tag ");
    await userEvent.keyboard("{Escape}");
    await userEvent.click(screen.getByRole("button", { name: "Create card" }));

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { name: "Card list destination" })).toBeVisible();
    expect(getCards().find((card) => card.frontText === "Tagged front")).toMatchObject({
      deckId: deck.id,
      tags: ["chapter-1", "new tag"],
    });
  });

  it("CARD-MANAGEMENT-05 offers no fallback tags when the Deck has no Cards", async () => {
    // Given: Use this case's inputs and any shared test setup.
    replaceRemoteDecks([deck]);
    renderPage();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Edit tags" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("dialog", { name: "Select tags" })).toBeVisible();
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  });

  it("shows route recovery when the target Deck is unavailable", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `renderPage` with the prepared inputs.
    renderPage("missing-deck");

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("heading", { level: 1, name: "Deck not found" })).toBeVisible();
  });

  it("stays on the creation Page with both inputs when saving fails", async () => {
    // Given: Use this case's inputs and any shared test setup.
    writes.rejected = true;
    renderPage();
    // When: Exercise `userEvent.type` with the prepared inputs.
    await userEvent.type(screen.getByRole("textbox", { name: "Front text" }), "Retained front");
    await userEvent.click(screen.getByRole("tab", { name: "Back" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Back text" }), "Retained back");

    await userEvent.click(screen.getByRole("button", { name: "Create card" }));

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByText("Unable to create this card. Try again.")).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Card list destination" })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Back text" })).toHaveValue("Retained back");
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("tab", { name: "Front" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("textbox", { name: "Front text" })).toHaveValue("Retained front");
    expect(screen.getByRole("button", { name: "Create card" })).toBeEnabled();
  });

  it("confirms before leaving when input is dirty, retains input on keep editing, and discards on confirm", async () => {
    // Given: Prepare `frontText` and any shared test state below.
    renderPage();
    const frontText = screen.getByRole("textbox", { name: "Front text" });
    // When: Exercise `userEvent.type` with the prepared inputs.
    await userEvent.type(frontText, "Unsaved front");

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    const dialog = screen.getByRole("alertdialog", { name: "Discard unsaved changes?" });
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("Your changes will be lost if you leave this page.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Keep editing" })).toHaveFocus();

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Keep editing" }));
    // Then: Verify the expected result in the assertions below.
    expect(dialog).not.toBeInTheDocument();
    expect(frontText).toHaveValue("Unsaved front");

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await userEvent.click(screen.getByRole("button", { name: "Discard changes" }));
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { level: 1, name: "Card list destination" })).toBeVisible();
  });

  it("does not confirm when dirty input is reverted back to empty", async () => {
    // Given: Prepare `frontText` and any shared test state below.
    renderPage();
    const frontText = screen.getByRole("textbox", { name: "Front text" });
    // When: Exercise `userEvent.type` with the prepared inputs.
    await userEvent.type(frontText, "Temporary");
    await userEvent.clear(frontText);

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(await screen.findByRole("heading", { level: 1, name: "Card list destination" })).toBeVisible();
  });

  it("confirms when leaving during creation with submitting description and navigates upon completion", async () => {
    // Given: Prepare `defer` and any shared test state below.
    const defer = Promise.withResolvers<void>();
    writes.pending = defer.promise;
    renderPage();

    // When: Exercise `userEvent.type` with the prepared inputs.
    await userEvent.type(screen.getByRole("textbox", { name: "Front text" }), "Submitting front");
    await userEvent.click(screen.getByRole("tab", { name: "Back" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Back text" }), "Submitting back");
    await userEvent.click(screen.getByRole("button", { name: "Create card" }));

    await userEvent.click(screen.getByRole("button", { name: "Leave route" }));

    const dialog = screen.getByRole("alertdialog", { name: "Discard unsaved changes?" });
    // Then: Verify the expected result in the assertions below.
    expect(
      screen.getByText(
        "Card creation is in progress and will continue if you leave. You will be taken to the card list when it succeeds, or see a notification if it fails."
      )
    ).toBeVisible();

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Keep editing" }));
    // Then: Verify the expected result in the assertions below.
    expect(dialog).not.toBeInTheDocument();

    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(async () => {
      defer.resolve();
      await Promise.resolve();
    });

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { level: 1, name: "Card list destination" })).toBeVisible();
    expect(screen.getByText("Created card “Submitting front”.")).toBeVisible();
  });

  it("allows discarding changes while creation is pending without reviving the unmounted Page", async () => {
    // Given: Prepare `defer` and any shared test state below.
    const defer = Promise.withResolvers<void>();
    writes.pending = defer.promise;
    renderPage();

    // When: Exercise `userEvent.type` with the prepared inputs.
    await userEvent.type(screen.getByRole("textbox", { name: "Front text" }), "Discarded while pending");
    await userEvent.click(screen.getByRole("tab", { name: "Back" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Back text" }), "Discarded back");
    await userEvent.click(screen.getByRole("button", { name: "Create card" }));

    await userEvent.click(screen.getByRole("button", { name: "Leave route" }));
    await userEvent.click(screen.getByRole("button", { name: "Discard changes" }));

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { level: 1, name: "Deck list destination" })).toBeVisible();

    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(async () => {
      defer.resolve();
      await Promise.resolve();
    });

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("heading", { level: 1, name: "Deck list destination" })).toBeVisible();
    expect(screen.queryByText("Created card “Discarded while pending”.")).not.toBeInTheDocument();
    expect(getCards().some((card) => card.frontText === "Discarded while pending")).toBe(true);
  });

  it("prioritizes save success over an unanswered leave confirmation dialog", async () => {
    // Given: Prepare `defer` and any shared test state below.
    const defer = Promise.withResolvers<void>();
    writes.pending = defer.promise;
    renderPage();

    // When: Exercise `userEvent.type` with the prepared inputs.
    await userEvent.type(screen.getByRole("textbox", { name: "Front text" }), "Conflicting front");
    await userEvent.click(screen.getByRole("tab", { name: "Back" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Back text" }), "Conflicting back");
    await userEvent.click(screen.getByRole("button", { name: "Create card" }));

    await userEvent.click(screen.getByRole("button", { name: "Leave route" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("alertdialog", { name: "Discard unsaved changes?" })).toBeVisible();

    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(async () => {
      defer.resolve();
      await Promise.resolve();
    });

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { level: 1, name: "Card list destination" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Deck list destination" })).not.toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByText("Created card “Conflicting front”.")).toBeVisible();
  });

  it("keeps confirmation dialog open when save fails while unanswered, allowing retry after keep editing", async () => {
    // Given: Prepare `defer` and any shared test state below.
    const defer = Promise.withResolvers<void>();
    writes.pending = defer.promise;
    renderPage();

    // When: Exercise `userEvent.type` with the prepared inputs.
    await userEvent.type(screen.getByRole("textbox", { name: "Front text" }), "Failing front");
    await userEvent.click(screen.getByRole("tab", { name: "Back" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Back text" }), "Failing back");
    await userEvent.click(screen.getByRole("button", { name: "Create card" }));

    await userEvent.click(screen.getByRole("button", { name: "Leave route" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("alertdialog", { name: "Discard unsaved changes?" })).toBeVisible();

    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(async () => {
      writes.rejected = true;
      defer.resolve();
      await Promise.resolve();
    });

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("alertdialog", { name: "Discard unsaved changes?" })).toBeVisible();
    expect(screen.getByText("Unable to create this card. Try again.")).toBeVisible();

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Keep editing" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create card" })).toBeEnabled();

    // Now retry successfully
    writes.rejected = false;
    writes.pending = null;
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Create card" }));
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { level: 1, name: "Card list destination" })).toBeVisible();
    expect(screen.getByText("Created card “Failing front”.")).toBeVisible();
  });
});
