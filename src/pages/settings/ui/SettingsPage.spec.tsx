import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { linkWithPopup, signOut } from "firebase/auth";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { setAuthUser } from "@/entities/auth";
import { updatePreferences } from "@/entities/preference";
import { createPreferences } from "@/test/factories";

import { SettingsPage } from "./SettingsPage";

const mocks = vi.hoisted(() => ({
  auth: { currentUser: { isAnonymous: true } },
}));

vi.mock("@/shared/firebase", () => ({ auth: mocks.auth }));
vi.mock("firebase/auth");

const renderPage = () => {
  const router = createMemoryRouter(
    [
      { path: "/", element: <div>Home Page</div> },
      {
        path: "/settings",
        element: <SettingsPage />,
      },
    ],
    { initialEntries: ["/settings"] }
  );

  return render(<RouterProvider router={router} />);
};

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.mocked(linkWithPopup).mockReset();
    vi.mocked(linkWithPopup).mockResolvedValue({ user: {} } as never);
    vi.mocked(signOut).mockReset();
    vi.mocked(signOut).mockResolvedValue(undefined);
    setAuthUser(null);
    updatePreferences(createPreferences({ appearance: { darkMode: false } }));
  });

  it("navigates home when the user presses the route shortcut", async () => {
    renderPage();

    fireEvent.keyDown(window, { key: "t" });

    expect(await screen.findByText("Home Page")).toBeVisible();
  });

  it("lets a signed-in user retry a failed sign-out", async () => {
    setAuthUser({
      displayName: "Test User",
      isAnonymous: false,
      uid: "test-user",
    });
    vi.mocked(signOut).mockRejectedValueOnce(new Error("Sign-out failed")).mockResolvedValueOnce(undefined);
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Logout" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to sign out.");
    expect(screen.getByText("Test User")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Logout" })).toBeEnabled();
  });

  it("lets a signed-out user retry a failed sign-in", async () => {
    vi.mocked(linkWithPopup)
      .mockRejectedValueOnce(new Error("Sign-in failed"))
      .mockResolvedValueOnce({ user: {} } as never);
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to sign in.");

    await userEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Login" })).toBeEnabled();
  });
});
