import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { updatePreferences } from "@/entities/preference";
import { createPreferences } from "@/test/factories";
import { clearRemoteCards } from "@/entities/card";
import { replaceInvalidCardIds } from "@/test/utils/entityFixtures";

import { AppLayout } from "./AppLayout";

vi.mock("@/shared/firebase", () => ({ auth: { currentUser: null }, db: {} }));

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
    // Given: Establish the shared setup used by the following cases.
    clearRemoteCards();
    updatePreferences(createPreferences({ appearance: { darkMode: false } }));
  });

  it("PERSISTENCE-10 shows local read diagnostics and clears them with the subscription", () => {
    // Given: Use this case's inputs and any shared test setup.
    replaceInvalidCardIds(["invalid-card"]);
    // When: Exercise `renderLayout` with the prepared inputs.
    renderLayout();
    const warning =
      "Some saved cards could not be loaded (1). Their saved data is unchanged. Other saved data is still available.";
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText(warning)).toBeVisible();
    expect(screen.getByLabelText("Current location")).toBeVisible();
    // When: Exercise `act` with the prepared inputs.
    act(() => clearRemoteCards());
    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByText(warning)).not.toBeInTheDocument();
  });

  it("navigates from every application header destination", async () => {
    // Given: Prepare `user`, `location` and any shared test state below.
    const user = userEvent.setup();
    renderLayout();
    const location = screen.getByLabelText("Current location");

    // When: Exercise `user.click` with the prepared inputs.
    await user.click(screen.getByRole("button", { name: "tango" }));
    // Then: Verify the expected result in the assertions below.
    expect(location).toHaveTextContent("/");

    // When: Exercise `user.click` with the prepared inputs.
    await user.click(screen.getByRole("button", { name: "Import decks" }));
    // Then: Verify the expected result in the assertions below.
    expect(location).toHaveTextContent("/import");

    // When: Exercise `user.click` with the prepared inputs.
    await user.click(screen.getByRole("button", { name: "Open account" }));
    // Then: Verify the expected result in the assertions below.
    expect(location).toHaveTextContent("/account");

    // When: Exercise `user.click` with the prepared inputs.
    await user.click(screen.getByRole("button", { name: "Open settings" }));
    // Then: Verify the expected result in the assertions below.
    expect(location).toHaveTextContent("/settings");
  });

  it("toggles the saved theme through the application header", async () => {
    // Given: Prepare `user` and any shared test state below.
    const user = userEvent.setup();
    renderLayout();

    // When: Exercise `user.click` with the prepared inputs.
    await user.click(screen.getByRole("button", { name: "Switch to dark mode" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeVisible();

    // When: Exercise `user.click` with the prepared inputs.
    await user.click(screen.getByRole("button", { name: "Switch to light mode" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toBeVisible();
  });
});
