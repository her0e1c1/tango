import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { linkWithPopup, signOut } from "firebase/auth";
import { getI18n } from "react-i18next";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { replaceAuthSession } from "@/entities/auth";
import { updatePreferences } from "@/entities/preference";
import { ToastViewport } from "@/shared/ui/toast";
import { dismissToast } from "@/test/utils/toast";
import { actAsync } from "@/test/act";
import { createPreferences } from "@/test/factories";

import { AccountPage } from "./AccountPage";

const mocks = vi.hoisted(() => ({
  auth: { currentUser: { isAnonymous: true } },
}));

vi.mock("@/shared/firebase", () => ({ auth: mocks.auth }));
vi.mock("firebase/auth");

const renderPage = () => {
  const router = createMemoryRouter(
    [
      { path: "/", element: <div>Home Page</div> },
      { path: "/account", element: <AccountPage /> },
    ],
    { initialEntries: ["/account"] }
  );

  return render(
    <>
      <RouterProvider router={router} />
      <ToastViewport />
    </>
  );
};

describe("ACCOUNT-01 ACCOUNT-02 ACCOUNT-03 SETTINGS-04 AccountPage", () => {
  beforeEach(() => {
    // Given: Establish the shared setup used by the following cases.
    void getI18n().changeLanguage("en");
    dismissToast();
    vi.mocked(linkWithPopup).mockReset();
    vi.mocked(linkWithPopup).mockResolvedValue({ user: {} } as never);
    vi.mocked(signOut).mockReset();
    vi.mocked(signOut).mockResolvedValue(undefined);
    replaceAuthSession({
      displayName: null,
      isAnonymous: true,
      status: "authenticated",
      uid: "anonymous-user",
    });
    updatePreferences(createPreferences({ appearance: { darkMode: false } }));
  });

  it("shows the anonymous identity and offers Google sign-in", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `renderPage` with the prepared inputs.
    renderPage();

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("heading", { level: 1, name: "Account" })).toBeVisible();
    expect(screen.getByText("Anonymous account")).toBeVisible();
    expect(screen.getByText("Not available")).toBeVisible();
    expect(screen.getByText("anonymous-user")).toBeVisible();
    expect(screen.getByRole("button", { name: "Sign in with Google" })).toBeEnabled();
  });

  it("shows the linked identity and offers sign-out", () => {
    // Given: Use this case's inputs and any shared test setup.
    replaceAuthSession({
      displayName: "Test User",
      isAnonymous: false,
      status: "authenticated",
      uid: "linked-user",
    });
    // When: Exercise `renderPage` with the prepared inputs.
    renderPage();

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("Signed in with Google")).toBeVisible();
    expect(screen.getByText("Test User")).toBeVisible();
    expect(screen.getByText("linked-user")).toBeVisible();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeEnabled();
  });

  it("keeps sign-out pending when the earlier sign-in finishes during an auth transition", async () => {
    // Given: Prepare `signInRequest`, `signOutRequest` and any shared test state below.
    const signInRequest = Promise.withResolvers<Awaited<ReturnType<typeof linkWithPopup>>>();
    const signOutRequest = Promise.withResolvers<void>();
    vi.mocked(linkWithPopup).mockReturnValue(signInRequest.promise);
    vi.mocked(signOut).mockReturnValue(signOutRequest.promise);
    renderPage();

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Sign in with Google" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Sign in with Google" })).toBeDisabled();

    // When: Exercise `act` with the prepared inputs.
    act(() => {
      replaceAuthSession({
        displayName: "Test User",
        isAnonymous: false,
        status: "authenticated",
        uid: "anonymous-user",
      });
    });

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("Test User")).toBeVisible();
    expect(screen.getByText("anonymous-user")).toBeVisible();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeEnabled();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Sign out" })).toBeDisabled();

    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(async () => {
      signInRequest.resolve({ user: {} } as never);
      await signInRequest.promise;
    });

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("status", { name: "Toast notifications" })).toHaveTextContent("Signed in.");
    expect(screen.getByRole("button", { name: "Sign out" })).toBeDisabled();

    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(async () => {
      signOutRequest.resolve();
      await signOutRequest.promise;
      replaceAuthSession({
        displayName: null,
        isAnonymous: true,
        status: "authenticated",
        uid: "new-anonymous-user",
      });
    });

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("status")).toHaveTextContent("Signed out.");
    expect(screen.getByText("Anonymous account")).toBeVisible();
    expect(screen.getByText("new-anonymous-user")).toBeVisible();
    expect(screen.getByRole("button", { name: "Sign in with Google" })).toBeEnabled();
  });

  it("updates fixed copy in place without translating linked identity data", async () => {
    // Given: Prepare `heading`, `displayName` and any shared test state below.
    replaceAuthSession({
      displayName: "Test User",
      isAnonymous: false,
      status: "authenticated",
      uid: "linked-user",
    });
    renderPage();
    const heading = screen.getByRole("heading", { level: 1, name: "Account" });
    const displayName = screen.getByText("Test User");

    // When: Exercise `getI18n().changeLanguage` with the prepared inputs.
    await getI18n().changeLanguage("ja");

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("heading", { level: 1, name: "アカウント" })).toBe(heading);
    expect(screen.getByRole("heading", { level: 2, name: "プロフィール" })).toBeVisible();
    expect(screen.getByText("アカウント情報とGoogleログイン")).toBeVisible();
    expect(screen.getByText("Googleでログイン済み")).toBeVisible();
    expect(screen.getByText("表示名")).toBeVisible();
    expect(screen.getByText("ユーザーID")).toBeVisible();
    expect(screen.getByRole("button", { name: "ログアウト" })).toBeEnabled();
    expect(screen.getByText("Test User")).toBe(displayName);
    expect(screen.getByText("linked-user")).toBeVisible();
  });

  it("navigates home when the user presses the route shortcut", async () => {
    // Given: Use this case's inputs and any shared test setup.
    renderPage();

    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(window, { key: "t" });

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByText("Home Page")).toBeVisible();
  });

  it("lets the user retry a failed sign-in", async () => {
    // Given: Use this case's inputs and any shared test setup.
    vi.mocked(linkWithPopup)
      .mockRejectedValueOnce(new Error("Sign-in failed"))
      .mockResolvedValueOnce({ user: {} } as never);
    renderPage();

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Sign in with Google" }));
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to sign in.");

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Sign in with Google" }));

    // Then: Verify the expected result in the assertions below.
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(screen.getByRole("status")).toHaveTextContent("Signed in.");
  });

  it("lets the user retry a failed sign-out", async () => {
    // Given: Use this case's inputs and any shared test setup.
    replaceAuthSession({
      displayName: "Test User",
      isAnonymous: false,
      status: "authenticated",
      uid: "linked-user",
    });
    vi.mocked(signOut).mockRejectedValueOnce(new Error("Sign-out failed")).mockResolvedValueOnce(undefined);
    renderPage();

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to sign out.");

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));

    // Then: Verify the expected result in the assertions below.
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(screen.getByRole("status")).toHaveTextContent("Signed out.");
  });

  it("keeps a handled sign-in failure visible globally after leaving the Account page", async () => {
    // Given: Use this case's inputs and any shared test setup.
    vi.mocked(linkWithPopup).mockRejectedValueOnce(new Error("Sign-in failed"));
    renderPage();

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Sign in with Google" }));
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to sign in.");

    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(window, { key: "t" });

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByText("Home Page")).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to sign in.");
  });

  it("shows a sign-in failure that arrives after leaving the Account page", async () => {
    // Given: Prepare `request` and any shared test state below.
    const request = Promise.withResolvers<never>();
    vi.mocked(linkWithPopup).mockReturnValue(request.promise);
    renderPage();

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Sign in with Google" }));
    fireEvent.keyDown(window, { key: "t" });
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByText("Home Page")).toBeVisible();

    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(async () => {
      request.reject(new Error("Late sign-in failure"));
      await request.promise.catch(() => undefined);
    });

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to sign in.");
  });

  it("shows a sign-out failure that arrives after leaving the Account page", async () => {
    // Given: Prepare `request` and any shared test state below.
    replaceAuthSession({
      displayName: "Test User",
      isAnonymous: false,
      status: "authenticated",
      uid: "linked-user",
    });
    const request = Promise.withResolvers<void>();
    vi.mocked(signOut).mockReturnValue(request.promise);
    renderPage();

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    fireEvent.keyDown(window, { key: "t" });
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByText("Home Page")).toBeVisible();

    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(async () => {
      request.reject(new Error("Late sign-out failure"));
      await request.promise.catch(() => undefined);
    });

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to sign out.");
  });

  it("shows localized Japanese toast messages when active language is set to ja", async () => {
    // Given: Use this case's inputs and any shared test setup.
    await getI18n().changeLanguage("ja");
    renderPage();

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Googleでログイン" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("status", { name: "トースト通知" })).toHaveTextContent("ログインしました。");
  });
});
