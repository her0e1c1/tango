import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { showToast, ToastViewport } from "../toast";
import { dismissToast } from "@/test/utils/toast";
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
  dismissToast();
});

describe("DECK-MANAGEMENT-03 DECK-MANAGEMENT-04 CARD-MANAGEMENT-08 DestructiveActionDialog", () => {
  it("labels the alert dialog with the target and explanation", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    render(<DestructiveActionDialog {...defaultProps} />);

    const dialog = screen.getByRole("alertdialog", { name: "Delete deck?" });
    // Then: Verify the expected result in the assertions below.
    expect(dialog).toHaveAccessibleDescription(expect.stringContaining("Japanese verbs"));
    expect(dialog).toHaveAccessibleDescription(expect.stringContaining("cannot be undone"));
  });

  it("focuses Cancel first, traps Tab, and closes with Escape", async () => {
    // Given: Prepare `onCancel`, `cancel`, `confirm` and any shared test state below.
    const onCancel = vi.fn();
    render(<DestructiveActionDialog {...defaultProps} onCancel={onCancel} />);
    const cancel = screen.getByRole("button", { name: "Cancel" });
    const confirm = screen.getByRole("button", { name: "Delete deck" });
    const target = screen.getByText("Japanese verbs");

    expect(cancel).toHaveFocus();
    // When: Exercise `userEvent.tab` with the prepared inputs.
    await userEvent.tab({ shift: true });
    // Then: Verify the expected result in the assertions below.
    expect(target).toHaveFocus();
    // When: Exercise `userEvent.tab` with the prepared inputs.
    await userEvent.tab({ shift: true });
    // Then: Verify the expected result in the assertions below.
    expect(confirm).toHaveFocus();
    // When: Exercise `userEvent.tab` with the prepared inputs.
    await userEvent.tab();
    // Then: Verify the expected result in the assertions below.
    expect(target).toHaveFocus();

    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(cancel, { key: "Escape" });
    // Then: Verify the expected result in the assertions below.
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("excludes disabled controls and includes explicit tab stops in the focus trap", async () => {
    // Given: Prepare `cancel`, `detail`, `confirm` and any shared test state below.
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
    // When: Exercise `userEvent.tab` with the prepared inputs.
    await userEvent.tab({ shift: true });
    // Then: Verify the expected result in the assertions below.
    expect(detail).toHaveFocus();
    // When: Exercise `userEvent.tab` with the prepared inputs.
    await userEvent.tab({ shift: true });
    // Then: Verify the expected result in the assertions below.
    expect(target).toHaveFocus();
    // When: Exercise `userEvent.tab` with the prepared inputs.
    await userEvent.tab({ shift: true });
    // Then: Verify the expected result in the assertions below.
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
    // Given: Prepare `cancel` and any shared test state below.
    render(<DestructiveActionDialog {...defaultProps} description={description} />);
    const cancel = screen.getByRole("button", { name: "Cancel" });

    // When: Evaluate `fireEvent.keyDown` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    expect(fireEvent.keyDown(cancel, { key: "Tab", shiftKey: true })).toBe(true);
    expect(cancel).toHaveFocus();
  });

  it("restores focus to the control that opened it", async () => {
    // Given: Prepare `Example`, `trigger` and any shared test state below.
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

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    // Then: Verify the expected result in the assertions below.
    expect(trigger).toHaveFocus();
  });

  it("announces pending work and prevents confirmation, Cancel, and Escape", async () => {
    // Given: Prepare `onConfirm`, `onCancel`, `dialog` and any shared test state below.
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<DestructiveActionDialog {...defaultProps} pending onCancel={onCancel} onConfirm={onConfirm} />);

    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Delete deck" })).toBeDisabled();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Delete deck" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.keyDown(dialog, { key: "Escape" });
    // Then: Verify the expected result in the assertions below.
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("keeps focus inside when confirmation transitions to pending", async () => {
    // Given: Prepare `Example`, `dialog`, `confirm` and any shared test state below.
    const Example = () => {
      const [pending, setPending] = React.useState(false);
      return <DestructiveActionDialog {...defaultProps} pending={pending} onConfirm={() => setPending(true)} />;
    };
    render(<Example />);
    const dialog = screen.getByRole("alertdialog");
    const confirm = screen.getByRole("button", { name: "Delete deck" });
    const target = screen.getByText("Japanese verbs");
    confirm.focus();

    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(confirm);

    // Then: Verify the expected result in the assertions below.
    expect(dialog).toContainElement(target);
    expect(target).toHaveFocus();
    // When: Exercise `userEvent.tab` with the prepared inputs.
    await userEvent.tab();
    // Then: Verify the expected result in the assertions below.
    expect(target).toHaveFocus();
  });

  it("keeps a persistent Toast non-interactive while the dialog is open", async () => {
    // Given: Prepare `Example`, `trigger`, `toastId` and any shared test state below.
    const Example = () => {
      const [open, setOpen] = React.useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Reopen delete
          </button>
          {open ? <DestructiveActionDialog {...defaultProps} /> : null}
          <ToastViewport />
        </>
      );
    };
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Reopen delete" });
    trigger.focus();
    let toastId = 0;
    act(() => {
      toastId = showToast({ messageKey: "deckDeletion.toast.failure", tone: "error", durationMs: null });
    });
    expect(screen.getByRole("button", { name: "Dismiss notification" })).toBeVisible();

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(trigger);

    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByRole("button", { name: "Dismiss notification" })).not.toBeInTheDocument();
    const dialog = screen.getByRole("alertdialog");
    const cancel = screen.getByRole("button", { name: "Cancel" });
    expect(dialog).toContainElement(cancel);
    expect(cancel).toHaveFocus();

    // When: Exercise `trigger.focus` with the prepared inputs.
    trigger.focus();
    act(() => dismissToast(toastId));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("Japanese verbs")).toHaveFocus();
  });

  it("prevents duplicate confirmation before pending props update", () => {
    // Given: Prepare `onConfirm`, `onCancel`, `confirm` and any shared test state below.
    const onConfirm = vi.fn(
      () =>
        new Promise<void>(() => {
          // This promise intentionally remains pending to exercise duplicate-submit protection.
        })
    );
    const onCancel = vi.fn();
    render(<DestructiveActionDialog {...defaultProps} onCancel={onCancel} onConfirm={onConfirm} />);
    const confirm = screen.getByRole("button", { name: "Delete deck" });

    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" });

    // Then: Verify the expected result in the assertions below.
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("supports synchronous onConfirm callbacks", () => {
    // Given: Prepare `onConfirm`, `confirm` and any shared test state below.
    const onConfirm = vi.fn();
    render(<DestructiveActionDialog {...defaultProps} onConfirm={onConfirm} />);
    const confirm = screen.getByRole("button", { name: "Delete deck" });

    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(confirm);
    // Then: Verify the expected result in the assertions below.
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("handles rejected onConfirm promises without unhandled promise rejections", async () => {
    // Given: Prepare `unhandledRejection`, `listener`, `rejectionReason` and any shared test state below.
    let unhandledRejection: unknown;
    const listener = (event: PromiseRejectionEvent) => {
      unhandledRejection = event.reason;
    };
    window.addEventListener("unhandledrejection", listener);

    const rejectionReason = new Error("Async failure");
    const onConfirm = vi.fn(() => Promise.reject(rejectionReason));

    render(<DestructiveActionDialog {...defaultProps} onConfirm={onConfirm} />);
    const confirm = screen.getByRole("button", { name: "Delete deck" });

    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(confirm);
    // Then: Verify the expected result in the assertions below.
    expect(onConfirm).toHaveBeenCalledOnce();

    await new Promise((resolve) => setTimeout(resolve, 0));

    window.removeEventListener("unhandledrejection", listener);
    expect(unhandledRejection).toBeUndefined();
  });
});
