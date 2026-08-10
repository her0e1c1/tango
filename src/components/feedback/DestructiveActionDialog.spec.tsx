import { cleanup, fireEvent, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DestructiveActionDialog } from "@/components/feedback/DestructiveActionDialog";

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
  cleanup();
  vi.clearAllMocks();
});

describe("DestructiveActionDialog", () => {
  it("labels the alert dialog with the target and explanation", () => {
    const view = render(<DestructiveActionDialog {...defaultProps} />);

    const dialog = view.getByRole("alertdialog", { name: "Delete deck?" });
    expect(dialog).toHaveAccessibleDescription(expect.stringContaining("Japanese verbs"));
    expect(dialog).toHaveAccessibleDescription(expect.stringContaining("cannot be undone"));
  });

  it("focuses Cancel first, traps Tab, and closes with Escape", async () => {
    const onCancel = vi.fn();
    const view = render(<DestructiveActionDialog {...defaultProps} onCancel={onCancel} />);
    const cancel = view.getByRole("button", { name: "Cancel" });
    const confirm = view.getByRole("button", { name: "Delete deck" });

    expect(cancel).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(confirm).toHaveFocus();
    await userEvent.tab();
    expect(cancel).toHaveFocus();

    fireEvent.keyDown(cancel, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledOnce();
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
    const view = render(<Example />);
    const trigger = view.getByRole("button", { name: "Open delete" });

    await userEvent.click(trigger);
    await userEvent.click(view.getByRole("button", { name: "Cancel" }));

    expect(trigger).toHaveFocus();
  });

  it("announces pending work and prevents duplicate confirmation", async () => {
    const onConfirm = vi.fn();
    const view = render(<DestructiveActionDialog {...defaultProps} pending onConfirm={onConfirm} />);

    expect(view.getByRole("alertdialog")).toHaveAttribute("aria-busy", "true");
    expect(view.getByRole("button", { name: "Delete deck" })).toBeDisabled();
    await userEvent.click(view.getByRole("button", { name: "Delete deck" }));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("prevents duplicate confirmation before pending props update", () => {
    const onConfirm = vi.fn(() => new Promise<void>(() => {}));
    const view = render(<DestructiveActionDialog {...defaultProps} onConfirm={onConfirm} />);
    const confirm = view.getByRole("button", { name: "Delete deck" });

    fireEvent.click(confirm);
    fireEvent.click(confirm);

    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
