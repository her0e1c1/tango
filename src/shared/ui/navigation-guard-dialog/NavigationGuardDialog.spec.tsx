import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { dismissToast, showToast, ToastViewport } from "../toast";
import { NavigationGuardDialog } from "./NavigationGuardDialog";

afterEach(() => dismissToast());

describe("CARD-17 DECK-12 NavigationGuardDialog", () => {
  it("keeps a persistent Toast non-interactive and restores replacement focus inside the modal", async () => {
    const user = userEvent.setup();
    const Harness = () => {
      const [open, setOpen] = React.useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Leave editor
          </button>
          {open ? <NavigationGuardDialog onDiscardChanges={vi.fn()} onKeepEditing={vi.fn()} /> : null}
          <ToastViewport />
        </>
      );
    };
    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Leave editor" });
    trigger.focus();
    act(() => {
      showToast({ message: "Save failed", tone: "error", durationMs: null });
    });
    expect(screen.getByRole("button", { name: "Dismiss notification" })).toBeVisible();

    await user.click(trigger);

    expect(screen.queryByRole("button", { name: "Dismiss notification" })).not.toBeInTheDocument();
    const keepEditing = screen.getByRole("button", { name: "Keep editing" });
    expect(keepEditing).toHaveFocus();

    trigger.focus();
    act(() => {
      showToast({ message: "Still unavailable", tone: "error", durationMs: null });
    });
    expect(keepEditing).toHaveFocus();
    expect(screen.getByText("Still unavailable")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Dismiss notification" })).not.toBeInTheDocument();
  });
});
