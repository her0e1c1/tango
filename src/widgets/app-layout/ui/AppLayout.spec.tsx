import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";

import { updatePreferences } from "@/entities/preference";
import { createPreferences } from "@/test/factories";

import { AppLayout } from "./AppLayout";

const CurrentLocation = () => {
  const location = useLocation();
  return <output aria-label="Current location">{location.pathname}</output>;
};

const renderLayout = () => {
  const router = createMemoryRouter(
    [
      {
        path: "*",
        element: (
          <AppLayout showHeader>
            <CurrentLocation />
          </AppLayout>
        ),
      },
    ],
    { initialEntries: ["/source"] }
  );

  return render(<RouterProvider router={router} />);
};

describe("AppLayout", () => {
  beforeEach(() => {
    updatePreferences(createPreferences({ appearance: { darkMode: false } }));
  });

  it("navigates from every application header destination", async () => {
    const user = userEvent.setup();
    renderLayout();
    const location = screen.getByLabelText("Current location");

    await user.click(screen.getByRole("button", { name: "tango" }));
    expect(location).toHaveTextContent("/");

    await user.click(screen.getByRole("button", { name: "Import decks" }));
    expect(location).toHaveTextContent("/import");

    await user.click(screen.getByRole("button", { name: "Open account" }));
    expect(location).toHaveTextContent("/account");

    await user.click(screen.getByRole("button", { name: "Open settings" }));
    expect(location).toHaveTextContent("/settings");
  });

  it("toggles the saved theme through the application header", async () => {
    const user = userEvent.setup();
    renderLayout();

    await user.click(screen.getByRole("button", { name: "Switch to dark mode" }));
    expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Switch to light mode" }));
    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toBeVisible();
  });
});
