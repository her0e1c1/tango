import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { createMemoryRouter, Link, RouterProvider, useNavigate } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { useNavigationGuard } from "./navigationGuard";

const GuardedRoute = () => {
  const navigate = useNavigate();
  const [isDirty, setDirty] = React.useState(false);
  const guard = useNavigationGuard(isDirty);

  return (
    <>
      <button type="button" onClick={() => setDirty(true)}>
        Edit
      </button>
      <button type="button" onClick={() => setDirty(false)}>
        Reset
      </button>
      <Link to="/next">Leave</Link>
      <button type="button" onClick={() => guard.allowNavigation(() => void navigate("/next"))}>
        Save successfully
      </button>
      <button type="button" onClick={() => guard.allowNavigation(() => undefined)}>
        No-op success
      </button>
      {guard.element}
    </>
  );
};

const renderGuard = () => {
  const router = createMemoryRouter(
    [
      { path: "/form", element: <GuardedRoute /> },
      { path: "/next", element: <h1>Next page</h1> },
    ],
    { initialEntries: ["/form"] }
  );
  return render(<RouterProvider router={router} />);
};

describe("useNavigationGuard", () => {
  it("allows clean navigation and intentional successful navigation", async () => {
    const view = renderGuard();
    await userEvent.click(screen.getByRole("link", { name: "Leave" }));
    expect(await screen.findByRole("heading", { name: "Next page" })).toBeVisible();
    view.unmount();

    renderGuard();
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    await userEvent.click(screen.getByRole("button", { name: "Save successfully" }));
    expect(await screen.findByRole("heading", { name: "Next page" })).toBeVisible();
  });

  it("keeps dirty input in place or resumes the exact blocked navigation", async () => {
    renderGuard();
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    const leave = screen.getByRole("link", { name: "Leave" });
    await userEvent.click(leave);

    const dialog = screen.getByRole("alertdialog", { name: "Discard unsaved changes?" });
    expect(screen.getByRole("button", { name: "Keep editing" })).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    expect(dialog).not.toBeInTheDocument();
    expect(leave).toHaveFocus();

    await userEvent.click(leave);
    await userEvent.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(await screen.findByRole("heading", { name: "Next page" })).toBeVisible();
  });

  it("does not retain a bypass after a no-op navigation", async () => {
    renderGuard();
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    await userEvent.click(screen.getByRole("button", { name: "No-op success" }));
    await userEvent.click(screen.getByRole("link", { name: "Leave" }));

    expect(screen.getByRole("alertdialog", { name: "Discard unsaved changes?" })).toBeVisible();
  });

  it("requests browser-native confirmation only while dirty", async () => {
    const addListener = vi.spyOn(window, "addEventListener");
    const removeListener = vi.spyOn(window, "removeEventListener");
    const view = renderGuard();
    const cleanEvent = new Event("beforeunload", { cancelable: true });
    fireEvent(window, cleanEvent);
    expect(cleanEvent.defaultPrevented).toBe(false);
    expect(addListener.mock.calls.some(([type]) => type === "beforeunload")).toBe(false);

    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    const dirtyEvent = new Event("beforeunload", { cancelable: true });
    fireEvent(window, dirtyEvent);
    expect(dirtyEvent.defaultPrevented).toBe(true);
    expect(addListener.mock.calls.some(([type]) => type === "beforeunload")).toBe(true);

    await userEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(removeListener.mock.calls.some(([type]) => type === "beforeunload")).toBe(true);
    view.unmount();
    addListener.mockRestore();
    removeListener.mockRestore();
  });
});
