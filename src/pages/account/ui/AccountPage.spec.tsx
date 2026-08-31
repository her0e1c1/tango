import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { linkWithPopup, signOut } from "firebase/auth";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { replaceAuthSession } from "@/entities/auth";
import { updatePreferences } from "@/entities/preference";
import { dismissToast, ToastViewport } from "@/shared/ui/toast";
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

describe("AccountPage", () => {
  beforeEach(() => {
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

  it("ACCOUNT-01 shows the anonymous identity and offers Google sign-in", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "Account" })).toBeVisible();
    expect(screen.getByText("Anonymous account")).toBeVisible();
    expect(screen.getByText("Not available")).toBeVisible();
    expect(screen.getByText("anonymous-user")).toBeVisible();
    expect(screen.getByRole("button", { name: "Sign in with Google" })).toBeEnabled();
  });

  it("ACCOUNT-03 shows the linked identity and offers sign-out", () => {
    replaceAuthSession({
      displayName: "Test User",
      isAnonymous: false,
      status: "authenticated",
      uid: "linked-user",
    });
    renderPage();

    expect(screen.getByText("Signed in with Google")).toBeVisible();
    expect(screen.getByText("Test User")).toBeVisible();
    expect(screen.getByText("linked-user")).toBeVisible();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeEnabled();
  });

  it("NAVIGATION-02 navigates home when the user presses the route shortcut", async () => {
    renderPage();

    fireEvent.keyDown(window, { key: "t" });

    expect(await screen.findByText("Home Page")).toBeVisible();
  });

  it("ACCOUNT-06 lets the user retry a failed sign-in without another mounted action", async () => {
    const retry = Promise.withResolvers<{ user: Record<string, never> }>();
    vi.mocked(linkWithPopup)
      .mockRejectedValueOnce(new Error("Sign-in failed"))
      .mockReturnValueOnce(retry.promise as never);
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Sign in with Google" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to sign in.");

    await userEvent.click(screen.getByRole("button", { name: "Retry" }));

    const signInButton = screen.getByRole("button", { name: "Sign in with Google" });
    expect(signInButton).toBeDisabled();
    expect(signInButton).toHaveAttribute("aria-busy", "true");
    await userEvent.click(signInButton);
    expect(linkWithPopup).toHaveBeenCalledTimes(2);

    await actAsync(async () => {
      retry.resolve({ user: {} });
      await retry.promise;
    });

    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(screen.getByRole("status")).toHaveTextContent("Signed in.");
    expect(signInButton).toBeEnabled();
  });

  it("ACCOUNT-07 lets the user retry a failed sign-out without another mounted action", async () => {
    const retry = Promise.withResolvers<void>();
    replaceAuthSession({
      displayName: "Test User",
      isAnonymous: false,
      status: "authenticated",
      uid: "linked-user",
    });
    vi.mocked(signOut).mockRejectedValueOnce(new Error("Sign-out failed")).mockReturnValueOnce(retry.promise);
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to sign out.");

    await userEvent.click(screen.getByRole("button", { name: "Retry" }));

    const signOutButton = screen.getByRole("button", { name: "Sign out" });
    expect(signOutButton).toBeDisabled();
    expect(signOutButton).toHaveAttribute("aria-busy", "true");
    await userEvent.click(signOutButton);
    expect(signOut).toHaveBeenCalledTimes(2);

    await actAsync(async () => {
      retry.resolve();
      await retry.promise;
    });

    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(screen.getByRole("status")).toHaveTextContent("Signed out.");
    expect(signOutButton).toBeEnabled();
  });

  it("ACCOUNT-06 removes the old Retry when the normal sign-in button reruns the command", async () => {
    const rerun = Promise.withResolvers<{ user: Record<string, never> }>();
    vi.mocked(linkWithPopup)
      .mockRejectedValueOnce(new Error("Sign-in failed"))
      .mockReturnValueOnce(rerun.promise as never);
    renderPage();

    const signInButton = screen.getByRole("button", { name: "Sign in with Google" });
    await userEvent.click(signInButton);
    expect(await screen.findByRole("button", { name: "Retry" })).toBeVisible();

    await userEvent.click(signInButton);

    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
    expect(signInButton).toBeDisabled();
    expect(signInButton).toHaveAttribute("aria-busy", "true");
    await userEvent.click(signInButton);
    expect(linkWithPopup).toHaveBeenCalledTimes(2);

    await actAsync(async () => {
      rerun.resolve({ user: {} });
      await rerun.promise;
    });
  });

  it("ACCOUNT-08 keeps sign-in Retry available after leaving the Account page", async () => {
    vi.mocked(linkWithPopup)
      .mockRejectedValueOnce(new Error("Sign-in failed"))
      .mockResolvedValueOnce({ user: {} } as never);
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Sign in with Google" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to sign in.");

    fireEvent.keyDown(window, { key: "t" });

    expect(await screen.findByText("Home Page")).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to sign in.");

    await userEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(screen.getByRole("status")).toHaveTextContent("Signed in.");
    expect(linkWithPopup).toHaveBeenCalledTimes(2);
  });

  it("ACCOUNT-02 shows a sign-in failure that arrives after leaving the Account page", async () => {
    const request = Promise.withResolvers<never>();
    vi.mocked(linkWithPopup).mockReturnValue(request.promise);
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Sign in with Google" }));
    fireEvent.keyDown(window, { key: "t" });
    expect(await screen.findByText("Home Page")).toBeVisible();

    await actAsync(async () => {
      request.reject(new Error("Late sign-in failure"));
      await request.promise.catch(() => undefined);
    });

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to sign in.");
  });
});
