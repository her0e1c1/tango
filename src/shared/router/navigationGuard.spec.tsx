import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { createMemoryRouter, Link, RouterProvider, useNavigate } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { useNavigationGuard } from "./navigationGuard";

const GuardedRoute = ({ pending = false }: { pending?: boolean }) => {
  const navigate = useNavigate();
  const [isDirty, setDirty] = React.useState(false);
  const guard = useNavigationGuard(isDirty, { pending });

  return (
    <>
      <button type="button" onClick={() => setDirty(true)}>
        Edit
      </button>
      <button type="button" onClick={() => setDirty(false)}>
        Reset
      </button>
      <Link to="/next">Leave</Link>
      <button
        type="button"
        onClick={() => void guard.allowNavigation({ historyAction: "PUSH", to: "/next" }, () => navigate("/next"))}
      >
        Save successfully
      </button>
      <button
        type="button"
        onClick={() => {
          void guard.allowNavigation({ historyAction: "PUSH", to: "/next" }, () => undefined);
          void navigate("/unrelated");
        }}
      >
        No-op then unrelated
      </button>
      <button
        type="button"
        onClick={() => {
          void guard.allowNavigation({ historyAction: "PUSH", to: "/next" }, () => new Promise(() => undefined));
          void navigate(-1);
        }}
      >
        Pending save then Back
      </button>
      {guard.element}
    </>
  );
};

const renderGuard = () => {
  const router = createMemoryRouter(
    [
      { path: "/form", element: <GuardedRoute /> },
      { path: "/previous", element: <h1>Previous page</h1> },
      { path: "/next", element: <h1>Next page</h1> },
      { path: "/unrelated", element: <h1>Unrelated page</h1> },
    ],
    { initialEntries: ["/previous", "/form"], initialIndex: 1 }
  );
  return render(<RouterProvider router={router} />);
};

describe("DECK-MANAGEMENT-08 DECK-MANAGEMENT-10 CARD-MANAGEMENT-09 CARD-MANAGEMENT-12 useNavigationGuard", () => {
  it("allows clean navigation and intentional successful navigation", async () => {
    // Given: Prepare `view` and any shared test state below.
    const view = renderGuard();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("link", { name: "Leave" }));
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { name: "Next page" })).toBeVisible();
    // When: Exercise `view.unmount` with the prepared inputs.
    view.unmount();

    renderGuard();
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    await userEvent.click(screen.getByRole("button", { name: "Save successfully" }));
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { name: "Next page" })).toBeVisible();
  });

  it("keeps dirty input in place or resumes the exact blocked navigation", async () => {
    // Given: Use this case's inputs and any shared test setup.
    renderGuard();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    const leave = screen.getByRole("link", { name: "Leave" });
    await userEvent.click(leave);

    const dialog = screen.getByRole("alertdialog", { name: "Discard unsaved changes?" });
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Keep editing" })).toHaveFocus();
    // When: Exercise `userEvent.keyboard` with the prepared inputs.
    await userEvent.keyboard("{Escape}");
    // Then: Verify the expected result in the assertions below.
    expect(dialog).not.toBeInTheDocument();
    expect(leave).toHaveFocus();

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(leave);
    await userEvent.click(screen.getByRole("button", { name: "Discard changes" }));
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { name: "Next page" })).toBeVisible();
  });

  it("clears a synchronous no-op before a same-turn unrelated navigation", async () => {
    // Given: Use this case's inputs and any shared test setup.
    renderGuard();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    await userEvent.click(screen.getByRole("button", { name: "No-op then unrelated" }));

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("alertdialog", { name: "Discard unsaved changes?" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Unrelated page" })).not.toBeInTheDocument();
  });

  it("resets a blocked state and prioritizes allowed navigation over an unanswered prompt", async () => {
    // Given: Use this case's inputs and any shared test setup.
    renderGuard();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    await userEvent.click(screen.getByRole("button", { name: "Pending save then Back" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("alertdialog", { name: "Discard unsaved changes?" })).toBeVisible();

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Save successfully" }));
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { name: "Next page" })).toBeVisible();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Previous page" })).not.toBeInTheDocument();
  });

  it("does not spend a pending save bypass on an unrelated Back navigation", async () => {
    // Given: Use this case's inputs and any shared test setup.
    renderGuard();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    await userEvent.click(screen.getByRole("button", { name: "Pending save then Back" }));

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("alertdialog", { name: "Discard unsaved changes?" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Previous page" })).not.toBeInTheDocument();
  });

  it("requests browser-native confirmation only while dirty", async () => {
    // Given: Prepare `addListener`, `removeListener`, `view` and any shared test state below.
    const addListener = vi.spyOn(window, "addEventListener");
    const removeListener = vi.spyOn(window, "removeEventListener");
    const view = renderGuard();
    const cleanEvent = new Event("beforeunload", { cancelable: true });
    fireEvent(window, cleanEvent);
    expect(cleanEvent.defaultPrevented).toBe(false);
    expect(addListener.mock.calls.some(([type]) => type === "beforeunload")).toBe(false);

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    const dirtyEvent = new Event("beforeunload", { cancelable: true });
    fireEvent(window, dirtyEvent);
    // Then: Verify the expected result in the assertions below.
    expect(dirtyEvent.defaultPrevented).toBe(true);
    expect(addListener.mock.calls.some(([type]) => type === "beforeunload")).toBe(true);

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Reset" }));
    // Then: Verify the expected result in the assertions below.
    expect(removeListener.mock.calls.some(([type]) => type === "beforeunload")).toBe(true);
    view.unmount();
    addListener.mockRestore();
    removeListener.mockRestore();
  });
});

describe("CARD-MANAGEMENT-13 pending navigation", () => {
  it("keeps the route mounted until saving finishes even when discard is requested", async () => {
    // Given: Prepare `PendingContext`, `PendingRoute`, `router` and any shared test state below.
    const PendingContext = React.createContext(true);
    const PendingRoute = () => <GuardedRoute pending={React.useContext(PendingContext)} />;
    const router = createMemoryRouter(
      [
        { path: "/form", element: <PendingRoute /> },
        { path: "/next", element: <h1>Next page</h1> },
      ],
      { initialEntries: ["/form"] }
    );
    const view = render(
      <PendingContext value={true}>
        <RouterProvider router={router} />
      </PendingContext>
    );
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("link", { name: "Leave" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Discard changes" })).toBeDisabled();
    expect(screen.getByText("Please wait for the current save to finish before leaving.")).toBeVisible();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Discard changes" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByRole("heading", { name: "Next page" })).not.toBeInTheDocument();
    // When: Exercise `view.rerender` with the prepared inputs.
    view.rerender(
      <PendingContext value={false}>
        <RouterProvider router={router} />
      </PendingContext>
    );
    await userEvent.click(screen.getByRole("button", { name: "Discard changes" }));
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { name: "Next page" })).toBeVisible();
  });
});
