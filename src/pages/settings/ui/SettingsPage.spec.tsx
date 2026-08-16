import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { replaceAuthSession } from "@/entities/auth";
import { updatePreferences } from "@/entities/preferences";
import { createPreferences } from "@/test/factories";

import { SettingsPage } from "./SettingsPage";

vi.mock("@/shared/firebase", () => ({ auth: {} }));

const successfulOperation = () => Promise.resolve();

const renderPage = ({
  login = successfulOperation,
  logout = successfulOperation,
}: {
  login?: () => Promise<void>;
  logout?: () => Promise<void>;
} = {}) => {
  const router = createMemoryRouter(
    [
      { path: "/", element: <div>Home Page</div> },
      {
        path: "/settings",
        element: <SettingsPage login={login} logout={logout} />,
      },
    ],
    { initialEntries: ["/settings"] }
  );

  return render(<RouterProvider router={router} />);
};

describe("SettingsPage", () => {
  beforeEach(() => {
    replaceAuthSession({ status: "initializing" });
    updatePreferences(createPreferences({ appearance: { darkMode: false } }));
  });

  it("navigates home when the user presses the route shortcut", async () => {
    renderPage();

    fireEvent.keyDown(window, { key: "t" });

    expect(await screen.findByText("Home Page")).toBeVisible();
  });

  it("lets a signed-in user retry a failed sign-out", async () => {
    replaceAuthSession({
      displayName: "Test User",
      isAnonymous: false,
      status: "authenticated",
      uid: "test-user",
    });
    let shouldFail = true;
    const logout = () => {
      if (shouldFail) {
        shouldFail = false;
        return Promise.reject(new Error("Sign-out failed"));
      }
      return Promise.resolve();
    };
    renderPage({ logout });

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
    let shouldFail = true;
    const login = () => {
      if (shouldFail) {
        shouldFail = false;
        return Promise.reject(new Error("Sign-in failed"));
      }
      return Promise.resolve();
    };
    renderPage({ login });

    await userEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to sign in.");

    await userEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Login" })).toBeEnabled();
  });
});
