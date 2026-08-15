import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DestructiveActionDialog } from "./DestructiveActionDialog";

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

    expect(cancel).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(confirm).toHaveFocus();
    await userEvent.tab();
    expect(cancel).toHaveFocus();

    fireEvent.keyDown(cancel, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("excludes disabled controls and includes explicit tab stops in the focus trap", () => {
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
    const detail = screen.getByText("Focusable detail");
    const confirm = screen.getByRole("button", { name: "Delete deck" });
    detail.focus();

    expect(fireEvent.keyDown(detail, { key: "Tab", shiftKey: true })).toBe(false);
    expect(confirm).toHaveFocus();
  });

  it.each([
    [
      "hidden",
      <div key="hidden" hidden>
        <button type="button">Hidden detail</button>
      </div>,
    ],
    [
      "inert",
      <div key="inert" inert>
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

  it("announces pending work and prevents duplicate confirmation", async () => {
    const onConfirm = vi.fn();
    render(<DestructiveActionDialog {...defaultProps} pending onConfirm={onConfirm} />);

    expect(screen.getByRole("alertdialog")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "Delete deck" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Delete deck" }));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("prevents duplicate confirmation before pending props update", () => {
    const onConfirm = vi.fn(
      () =>
        new Promise<void>(() => {
          // This promise intentionally remains pending to exercise duplicate-submit protection.
        })
    );
    render(<DestructiveActionDialog {...defaultProps} onConfirm={onConfirm} />);
    const confirm = screen.getByRole("button", { name: "Delete deck" });

    fireEvent.click(confirm);
    fireEvent.click(confirm);

    expect(onConfirm).toHaveBeenCalledOnce();
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
    globalThis.addEventListener("unhandledrejection", listener);

    const rejectionReason = new Error("Async failure");
    const onConfirm = vi.fn(() => Promise.reject(rejectionReason));

    render(<DestructiveActionDialog {...defaultProps} onConfirm={onConfirm} />);
    const confirm = screen.getByRole("button", { name: "Delete deck" });

    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledOnce();

    await new Promise((resolve) => setTimeout(resolve, 0));

    globalThis.removeEventListener("unhandledrejection", listener);
    expect(unhandledRejection).toBeUndefined();
  });
});
