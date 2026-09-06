import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { dismissToast, showToast, ToastViewport } from "@/shared/ui/toast";

import { BulkDifficultyDialog } from "./BulkDifficultyDialog";

const defaultProps = {
  cardCount: 2,
  difficulty: 7,
  onCancel: vi.fn(),
  onConfirm: vi.fn(),
};

afterEach(() => {
  vi.clearAllMocks();
  dismissToast();
  document.body.style.overflow = "";
});

describe("BulkDifficultyDialog [CARD-19] [CARD-20]", () => {
  it("uses a non-destructive dialog to summarize the frozen change", () => {
    render(<BulkDifficultyDialog {...defaultProps} />);

    const dialog = screen.getByRole("dialog", { name: "Change card difficulty?" });
    expect(dialog).toHaveAccessibleDescription("Set 2 visible cards to difficulty 7.");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("focuses Cancel first, traps focus, and closes with Escape", async () => {
    const onCancel = vi.fn();
    render(<BulkDifficultyDialog {...defaultProps} onCancel={onCancel} />);
    const description = screen.getByText("Set 2 visible cards to difficulty 7.");
    const cancel = screen.getByRole("button", { name: "Cancel" });
    const confirm = screen.getByRole("button", { name: "Apply change" });

    expect(cancel).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(description).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(confirm).toHaveFocus();
    await userEvent.tab();
    expect(description).toHaveFocus();

    fireEvent.keyDown(description, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("locks body scrolling and restores body state and trigger focus on close", async () => {
    document.body.style.overflow = "clip";
    const Example = () => {
      const [open, setOpen] = React.useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open bulk change
          </button>
          {open ? <BulkDifficultyDialog {...defaultProps} onCancel={() => setOpen(false)} /> : null}
        </>
      );
    };
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Open bulk change" });

    await userEvent.click(trigger);
    expect(document.body).toHaveStyle({ overflow: "hidden" });
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(document.body).toHaveStyle({ overflow: "clip" });
    expect(trigger).toHaveFocus();
  });

  it("announces pending work and prevents confirmation, cancellation, and Escape", async () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(<BulkDifficultyDialog {...defaultProps} pending onCancel={onCancel} onConfirm={onConfirm} />);

    const dialog = screen.getByRole("dialog");
    const description = screen.getByText("Set 2 visible cards to difficulty 7.");
    expect(dialog).toHaveAttribute("aria-busy", "true");
    expect(description).toHaveFocus();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Apply change" })).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await userEvent.click(screen.getByRole("button", { name: "Apply change" }));
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(onCancel).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("moves focus inside before confirmation transitions to pending", () => {
    const Example = () => {
      const [pending, setPending] = React.useState(false);
      return <BulkDifficultyDialog {...defaultProps} pending={pending} onConfirm={() => setPending(true)} />;
    };
    render(<Example />);
    const confirm = screen.getByRole("button", { name: "Apply change" });
    confirm.focus();

    fireEvent.click(confirm);

    expect(screen.getByText("Set 2 visible cards to difficulty 7.")).toHaveFocus();
  });

  it("prevents duplicate confirmation before pending props update", () => {
    const onConfirm = vi.fn(
      () =>
        new Promise<void>(() => {
          // This promise intentionally stays pending to exercise the pre-render submission lock.
        })
    );
    const onCancel = vi.fn();
    render(<BulkDifficultyDialog {...defaultProps} onCancel={onCancel} onConfirm={onConfirm} />);
    const confirm = screen.getByRole("button", { name: "Apply change" });

    fireEvent.click(confirm);
    fireEvent.click(confirm);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("keeps persistent Toast interaction and focus within the active dialog", async () => {
    const Example = () => {
      const [open, setOpen] = React.useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Reopen bulk change
          </button>
          {open ? <BulkDifficultyDialog {...defaultProps} /> : null}
          <ToastViewport />
        </>
      );
    };
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Reopen bulk change" });
    let toastId = 0;
    act(() => {
      toastId = showToast({ message: "Bulk change failed", tone: "error", durationMs: null });
    });

    await userEvent.click(trigger);

    expect(screen.queryByRole("button", { name: "Dismiss notification" })).not.toBeInTheDocument();
    trigger.focus();
    act(() => dismissToast(toastId));
    expect(screen.getByText("Set 2 visible cards to difficulty 7.")).toHaveFocus();
  });
});
