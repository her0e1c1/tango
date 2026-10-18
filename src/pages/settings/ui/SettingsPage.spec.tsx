import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { updatePreferences } from "@/entities/preference";
import { createPreferences } from "@/test/factories";

import { SettingsPage } from "./SettingsPage";

vi.mock("@/shared/firebase", () => ({ auth: { currentUser: null }, db: {} }));

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
    // Given: Establish the shared setup used by the following cases.
    updatePreferences(createPreferences({ appearance: { darkMode: false } }));
  });

  it("navigates home when the user presses the route shortcut", async () => {
    // Given: Use this case's inputs and any shared test setup.
    renderPage();

    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(window, { key: "t" });

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByText("Home Page")).toBeVisible();
  });

  it("keeps account identity and authentication controls out of settings", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `renderPage` with the prepared inputs.
    renderPage();

    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByRole("region", { name: "Account" })).not.toBeInTheDocument();
    expect(screen.queryByText("User ID")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /sign in|sign out/i })).not.toBeInTheDocument();
  });
});
