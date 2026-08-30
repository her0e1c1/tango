import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DestructiveActionDialog } from "./DestructiveActionDialog";
import { dismissToast, showToast, ToastViewport } from "../toast";

const defaultProps = {
  title: "Delete deck?",
  targetLabel: "Deck",
  targetName: "Japanese verbs",
  description: <p>This permanently deletes 12 cards and cannot be undone.</p>,
  confirmLabel: "Delete deck",
  onCancel: vi.fn(),
  onConfirm: vi.fn(),
};

afterEach(() => {
  dismissToast();
  vi.clearAllMocks();
});

describe("DestructiveActionDialog", () => {
  it("labels the alert dialog with the target and explanation", () => {
    render(<DestructiveActionDialog {...defaultProps} />);

    const dialog = screen.getByRole("alertdialog", { name: "Delete deck?" });
    expect(dialog).toHaveAccessibleDescription(expect.stringContaining("Japanese verbs"));
    expect(dialog).toHaveAccessibleDescription(expect.stringContaining("cannot be undone"));
  });

  it("focuses Cancel first, traps Tab, and closes with Escape", async () => {
    const onCancel = vi.fn();
    render(<DestructiveActionDialog {...defaultProps} onCancel={onCancel} />);
    const cancel = screen.getByRole("button", { name: "Cancel" });
    const confirm = screen.getByRole("button", { name: "Delete deck" });
    const target = screen.getByText("Japanese verbs");

    expect(cancel).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(target).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(confirm).toHaveFocus();
    await userEvent.tab();
    expect(target).toHaveFocus();

    fireEvent.keyDown(cancel, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("excludes disabled controls and includes explicit tab stops in the focus trap", async () => {
    render(
      <DestructiveActionDialog
        {...defaultProps}
        description={
          <>
            <button type="button" disabled tabIndex={0}>
              Disabled detail
            </button>
            <details>
              <summary tabIndex={0}>Focusable detail</summary>
            </details>
          </>
        }
      />
    );
    const cancel = screen.getByRole("button", { name: "Cancel" });
    const detail = screen.getByText("Focusable detail");
    const confirm = screen.getByRole("button", { name: "Delete deck" });
    const target = screen.getByText("Japanese verbs");

    expect(cancel).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(detail).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(target).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(confirm).toHaveFocus();
  });

  it.each([
    [
      "hidden",
      <div hidden>
        <button type="button">Hidden detail</button>
      </div>,
    ],
    [
      "inert",
      <div inert>
        <button type="button">Inert detail</button>
      </div>,
    ],
  ])("preserves the dialog's unfiltered %s descendant semantics", (_kind, description) => {
    render(<DestructiveActionDialog {...defaultProps} description={description} />);
    const cancel = screen.getByRole("button", { name: "Cancel" });

    expect(fireEvent.keyDown(cancel, { key: "Tab", shiftKey: true })).toBe(true);
    expect(cancel).toHaveFocus();
  });

  it("restores focus to the control that opened it", async () => {
    const Example = () => {
      const [open, setOpen] = React.useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open delete
          </button>
          {open ? <DestructiveActionDialog {...defaultProps} onCancel={() => setOpen(false)} /> : null}
        </>
      );
    };
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Open delete" });

    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(trigger).toHaveFocus();
  });

  it("hosts existing Toast controls inside the modal interaction boundary", async () => {
    const onRetry = vi.fn();
    const Harness = () => {
      const [open, setOpen] = React.useState(true);
      return (
        <>
          {open ? <DestructiveActionDialog {...defaultProps} onCancel={() => setOpen(false)} /> : null}
          <ToastViewport />
        </>
      );
    };
    act(() => showToast({ message: "Try again", tone: "error", action: { label: "Retry", onClick: onRetry } }));
    render(<Harness />);

    const dialog = screen.getByRole("alertdialog", { name: "Delete deck?" });
    const alert = screen.getByRole("alert");
    const dismiss = within(dialog).getByRole("button", { name: "Dismiss notification" });
    const retry = within(dialog).getByRole("button", { name: "Retry" });
    const target = screen.getByText("Japanese verbs");
    expect(alert).toHaveTextContent("Error: Try again");
    expect(within(dialog).getByText("Try again")).toBeVisible();
    expect(retry).toBeVisible();

    dismiss.focus();
    await userEvent.tab();
    expect(target).toHaveFocus();

    await userEvent.click(retry);
    expect(target).toHaveFocus();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(onRetry).toHaveBeenCalledOnce();

    act(() => showToast({ message: "Still failing", tone: "error" }));
    const nextDismiss = within(dialog).getByRole("button", { name: "Dismiss notification" });
    await userEvent.click(nextDismiss);
    expect(target).toHaveFocus();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    act(() => showToast({ message: "Persistent failure", tone: "error" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Persistent failure");
    expect(within(dialog).getByText("Persistent failure")).toBeVisible();

    await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));

    const globalAlert = screen.getByRole("alert");
    expect(globalAlert).toHaveTextContent("Error: Persistent failure");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("announces pending work, prevents confirmation, and allows Close or Escape", async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<DestructiveActionDialog {...defaultProps} pending onCancel={onCancel} onConfirm={onConfirm} />);

    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "Close" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Delete deck" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Delete deck" }));
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it("prevents duplicate confirmation before pending props update", () => {
    const onConfirm = vi.fn(
      () =>
        new Promise<void>(() => {
          // This promise intentionally remains pending to exercise duplicate-submit protection.
        })
    );
    const onCancel = vi.fn();
    render(<DestructiveActionDialog {...defaultProps} onCancel={onCancel} onConfirm={onConfirm} />);
    const confirm = screen.getByRole("button", { name: "Delete deck" });

    fireEvent.click(confirm);
    fireEvent.click(confirm);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" });

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("supports synchronous onConfirm callbacks", () => {
    const onConfirm = vi.fn();
    render(<DestructiveActionDialog {...defaultProps} onConfirm={onConfirm} />);
    const confirm = screen.getByRole("button", { name: "Delete deck" });

    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("handles rejected onConfirm promises without unhandled promise rejections", async () => {
    let unhandledRejection: unknown;
    const listener = (event: PromiseRejectionEvent) => {
      unhandledRejection = event.reason;
    };
    window.addEventListener("unhandledrejection", listener);

    const rejectionReason = new Error("Async failure");
    const onConfirm = vi.fn(() => Promise.reject(rejectionReason));

    render(<DestructiveActionDialog {...defaultProps} onConfirm={onConfirm} />);
    const confirm = screen.getByRole("button", { name: "Delete deck" });

    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledOnce();

    await new Promise((resolve) => setTimeout(resolve, 0));

    window.removeEventListener("unhandledrejection", listener);
    expect(unhandledRejection).toBeUndefined();
  });
});
