import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { linkWithPopup, signOut } from "firebase/auth";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { replaceAuthSession } from "@/entities/auth";
import { updatePreferences } from "@/entities/preference";
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

  return render(<RouterProvider router={router} />);
};

describe("AccountPage", () => {
  beforeEach(() => {
    vi.mocked(linkWithPopup).mockReset();
    vi.mocked(linkWithPopup).mockResolvedValue({ user: {} } as never);
    vi.mocked(signOut).mockReset();
    vi.mocked(signOut).mockResolvedValue(undefined);
    replaceAuthSession({
      googleAccount: null,
      isAnonymous: true,
      status: "authenticated",
      uid: "anonymous-user",
    });
    updatePreferences(createPreferences({ appearance: { darkMode: false } }));
  });

  it("shows the anonymous identity and offers Google sign-in", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "Account" })).toBeVisible();
    expect(screen.getByText("Anonymous account")).toBeVisible();
    expect(screen.getByText("Not available")).toBeVisible();
    expect(screen.getByText("anonymous-user")).toBeVisible();
    expect(screen.getByRole("button", { name: "Sign in with Google" })).toBeEnabled();
  });

  it("shows the linked identity and offers sign-out", () => {
    replaceAuthSession({
      googleAccount: { displayName: "Test User" },
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

  it("navigates home when the user presses the route shortcut", async () => {
    renderPage();

    fireEvent.keyDown(window, { key: "t" });

    expect(await screen.findByText("Home Page")).toBeVisible();
  });

  it("lets the user retry a failed sign-in", async () => {
    vi.mocked(linkWithPopup)
      .mockRejectedValueOnce(new Error("Sign-in failed"))
      .mockResolvedValueOnce({ user: {} } as never);
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Sign in with Google" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to sign in.");

    await userEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });

  it("lets the user retry a failed sign-out", async () => {
    replaceAuthSession({
      googleAccount: { displayName: "Test User" },
      isAnonymous: false,
      status: "authenticated",
      uid: "linked-user",
    });
    vi.mocked(signOut).mockRejectedValueOnce(new Error("Sign-out failed")).mockResolvedValueOnce(undefined);
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to sign out.");

    await userEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });
});
