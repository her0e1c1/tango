import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import App from "@/app/App";
import { replaceAuthSession, signOutCurrentUser } from "@/entities/auth";
import { editCard } from "@/entities/card";
import { applyCardChanges, clearRemoteCards } from "@/entities/card/model/store";
import { setRemoteDecks } from "@/entities/deck/model/store";
import { AccountPage } from "@/pages/account/ui/AccountPage";
import { accountPageStore } from "@/pages/account/model/store";
import { submit } from "@/pages/card-edit/model/actions/submit";
import { dismissToast } from "@/test/utils/toast";
import { createCard, createDeck } from "@/test/factories";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/app/auth/lifecycle", () => ({ startAuthSession: () => () => undefined }));
vi.mock("@/entities/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/auth")>()),
  signOutCurrentUser: vi.fn(),
}));
vi.mock("@/entities/card", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/card")>()),
  editCard: vi.fn(),
}));

const owner = { status: "authenticated" as const, uid: "owner", isAnonymous: false, displayName: null };
const deck = createDeck({ uid: owner.uid });
const card = createCard({ uid: owner.uid, deckId: deck.id });
const values = { frontText: "Saved content", backText: "Saved back", tags: ["custom"] };

describe("CARD-MANAGEMENT-26 CARD-MANAGEMENT-28 ACCOUNT-03 composed Card and Account results", () => {
  beforeEach(() => {
    // Given: Real actions, authentication state, routing, and Toasts share the same owner and Card.
    dismissToast();
    accountPageStore.setState(accountPageStore.getInitialState(), true);
    replaceAuthSession(owner);
    setRemoteDecks([deck]);
    clearRemoteCards();
    applyCardChanges([card]);
    vi.mocked(editCard).mockReset();
    vi.mocked(signOutCurrentUser).mockReset();
  });
  afterEach(() => {
    dismissToast();
    replaceAuthSession({ status: "unauthenticated" });
    setRemoteDecks([]);
    clearRemoteCards();
  });

  describe.each(["/account", "/account/", "/ACCOUNT"])("route %s", (path) => {
    it.each([
      { leave: false, failSave: false, cardFirst: true },
      { leave: false, failSave: true, cardFirst: true },
      { leave: true, failSave: false, cardFirst: true },
      { leave: true, failSave: true, cardFirst: true },
      { leave: false, failSave: false, cardFirst: false },
      { leave: false, failSave: true, cardFirst: false },
      { leave: true, failSave: false, cardFirst: false },
      { leave: true, failSave: true, cardFirst: false },
    ])(
      "preserves both results (leave=$leave, save failure=$failSave, Card first=$cardFirst)",
      async ({ leave, failSave, cardFirst }) => {
        // Given: A Card save is pending when the owner starts signing out on Account.
        const write = Promise.withResolvers<void>();
        const logout = Promise.withResolvers<void>();
        vi.mocked(editCard).mockReturnValueOnce(write.promise);
        vi.mocked(signOutCurrentUser).mockImplementationOnce(async () => {
          await logout.promise;
          replaceAuthSession(owner);
          throw new Error("Sign-out refused");
        });
        const router = createMemoryRouter(
          [
            { path: "/account", element: <AccountPage /> },
            { path: "/", element: <h1>Home</h1> },
          ],
          { initialEntries: [path] }
        );
        render(<App router={router} />);
        const saved = submit({ cardId: card.id, values });
        fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

        // When: Leave if requested, then temporarily hide all routes during the auth check.
        await act(async () => {
          if (leave) await router.navigate("/");
          replaceAuthSession({ status: "initializing" });
        });
        await act(async () => {
          const finishCard = () => {
            if (failSave) write.reject(new Error("Save refused"));
            else {
              applyCardChanges([{ ...card, ...values }]);
              write.resolve();
            }
          };
          if (cardFirst) {
            finishCard();
            await Promise.resolve();
            await Promise.resolve();
            logout.resolve();
          } else {
            logout.resolve();
            await Promise.resolve();
            await Promise.resolve();
            finishCard();
          }
          await saved;
        });

        // Then: Both real results survive the same-owner auth restoration, regardless of completion order.
        expect(screen.getByRole("heading", { level: 1, name: leave ? "Home" : "Account" })).toBeVisible();
        const visibleMessages = screen.getAllByText(/Unable to sign out\./);
        expect(visibleMessages.some((node) => !node.closest(".sr-only"))).toBe(true);
        const cardMessage = failSave ? "Unable to save changes. Try again." : "Updated card “Saved content”.";
        expect(screen.getAllByText(cardMessage).some((node) => !node.closest(".sr-only"))).toBe(true);
        expect(within(screen.getByRole("main")).queryAllByRole("alert")).toHaveLength(leave ? 0 : 1);
        expect(screen.getAllByRole("button", { name: "Dismiss notification" })).toHaveLength(leave ? 2 : 1);
        router.dispose();
      }
    );
  });

  it.each(["navigation", "different owner", "anonymous owner", "temporary auth check"])(
    "scopes an inline failure across %s",
    async (boundary) => {
      // Given: Account displays the current owner's refused sign-out inline.
      vi.mocked(signOutCurrentUser).mockRejectedValueOnce(new Error("Refused"));
      const router = createMemoryRouter(
        [
          { path: "/account", element: <AccountPage /> },
          { path: "/", element: <h1>Home</h1> },
        ],
        { initialEntries: ["/account"] }
      );
      render(<App router={router} />);
      fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
      expect(await screen.findByRole("alert")).toHaveTextContent("Unable to sign out.");

      // When: The visit or identity changes, or only a reversible auth check hides the page.
      await act(async () => {
        if (boundary === "navigation") {
          await router.navigate("/");
          await router.navigate(-1);
        } else if (boundary === "temporary auth check") replaceAuthSession({ status: "initializing" });
        else replaceAuthSession({ ...owner, uid: "replacement", isAnonymous: boundary === "anonymous owner" });
      });
      await act(async () => {
        replaceAuthSession(owner);
      });

      // Then: A real boundary permanently clears the old inline result; temporary auth hiding preserves it.
      expect(screen.queryAllByRole("alert")).toHaveLength(boundary === "temporary auth check" ? 1 : 0);
      router.dispose();
    }
  );

  it.each(["Home", "another owner"])("does not persist a late failure after moving to %s", async (destination) => {
    // Given: Sign-out is waiting on Account.
    const request = Promise.withResolvers<void>();
    vi.mocked(signOutCurrentUser).mockReturnValueOnce(request.promise);
    const router = createMemoryRouter(
      [
        { path: "/account", element: <AccountPage /> },
        { path: "/", element: <h1>Home</h1> },
      ],
      { initialEntries: ["/account"] }
    );
    render(<App router={router} />);
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    // When: The request fails after leaving the visit or switching identity.
    await act(async () => {
      if (destination === "Home") await router.navigate("/");
      else replaceAuthSession({ ...owner, uid: "replacement" });
      request.reject(new Error("Refused"));
    });

    // Then: Home gets its existing transient result, but another owner gets no stale failure.
    expect(screen.queryAllByRole("button", { name: "Dismiss notification" })).toHaveLength(
      destination === "Home" ? 1 : 0
    );

    // When: Dismiss the result and revisit the original Account/owner.
    await act(async () => {
      dismissToast();
      replaceAuthSession(owner);
      await router.navigate("/account");
    });

    // Then: The old operation does not create an indefinite inline error on the new visit.
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    router.dispose();
  });
});
