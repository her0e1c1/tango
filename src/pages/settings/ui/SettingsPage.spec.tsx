import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";

import { updatePreferences } from "@/entities/preference";
import { createPreferences } from "@/test/factories";

import { SettingsPage } from "./SettingsPage";

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
    updatePreferences(createPreferences({ appearance: { darkMode: false } }));
  });

  it("navigates home when the user presses the route shortcut", async () => {
    renderPage();

    fireEvent.keyDown(window, { key: "t" });

    expect(await screen.findByText("Home Page")).toBeVisible();
  });

  it("keeps account identity and authentication controls out of settings", () => {
    renderPage();

    expect(screen.queryByRole("region", { name: "Account" })).not.toBeInTheDocument();
    expect(screen.queryByText("User ID")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /sign in|sign out/i })).not.toBeInTheDocument();
  });
});
