import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { linkWithPopup, signOut } from "firebase/auth";
import { getI18n } from "react-i18next";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { replaceAuthSession } from "@/entities/auth";
import { updatePreferences } from "@/entities/preference";
import { dismissToast, ToastViewport } from "@/shared/ui/toast";
import { actAsync } from "@/test/act";
import { createPreferences } from "@/test/factories";

import { accountPageStore } from "../model/store";
import { AccountPage } from "./AccountPage";

const mocks = vi.hoisted(() => ({
  auth: { currentUser: { isAnonymous: true } },
}));

vi.mock("@/shared/firebase", () => ({ auth: mocks.auth }));
vi.mock("firebase/auth");

describe("ACCOUNT-01 ACCOUNT-02 ACCOUNT-03 AccountPage pending lifetime", () => {
  beforeEach(async () => {
    await getI18n().changeLanguage("en");
    dismissToast();
    accountPageStore.setState(accountPageStore.getInitialState(), true);
    vi.mocked(linkWithPopup).mockReset();
    vi.mocked(linkWithPopup).mockResolvedValue({ user: {} } as never);
    vi.mocked(signOut).mockReset();
    vi.mocked(signOut).mockResolvedValue(undefined);
    updatePreferences(createPreferences({ appearance: { darkMode: false } }));
  });

  describe.each([
    { operation: "signIn", button: "Sign in with Google", success: "Signed in.", failure: "Unable to sign in." },
    { operation: "signOut", button: "Sign out", success: "Signed out.", failure: "Unable to sign out." },
  ] as const)("$operation", ({ operation, button, success, failure }) => {
    it.each(["success", "failure"] as const)(
      "keeps pending across remounts until %s and allows another attempt",
      async (outcome) => {
        const request = Promise.withResolvers<void>();
        vi.mocked(linkWithPopup).mockImplementationOnce(async () => {
          await request.promise;
          return { user: {} } as never;
        });
        vi.mocked(signOut).mockReturnValueOnce(request.promise);
        replaceAuthSession({
          displayName: operation === "signIn" ? null : "Test User",
          isAnonymous: operation === "signIn",
          status: "authenticated",
          uid: "test-user",
        });
        const router = createMemoryRouter(
          [
            { path: "/", element: <div>Home Page</div> },
            { path: "/account", element: <AccountPage /> },
          ],
          { initialEntries: ["/account"] }
        );
        render(
          <>
            <RouterProvider router={router} />
            <ToastViewport />
          </>
        );

        await userEvent.click(screen.getByRole("button", { name: button }));
        expect(screen.getByRole("button", { name: button })).toBeDisabled();

        await actAsync(async () => {
          await router.navigate("/");
        });
        expect(screen.getByText("Home Page")).toBeVisible();
        await actAsync(async () => {
          await router.navigate("/account");
        });
        expect(screen.getByRole("button", { name: button })).toBeDisabled();

        await actAsync(async () => {
          if (outcome === "success") request.resolve();
          else request.reject(new Error("Action failed"));
          await request.promise.catch(() => undefined);
        });

        expect(screen.getByRole("button", { name: button })).toBeEnabled();
        expect(screen.getByRole(outcome === "success" ? "status" : "alert")).toHaveTextContent(
          outcome === "success" ? success : failure
        );

        await userEvent.click(screen.getByRole("button", { name: button }));
        await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
        expect(screen.getByRole("status", { name: "Toast notifications" })).toHaveTextContent(success);
        expect(screen.getByRole("button", { name: button })).toBeEnabled();
      }
    );
  });
});
