import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { afterEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";

import { showToast, ToastViewport } from "@/shared/ui/toast";
import { dismissToast } from "@/test/utils/toast";

import { StudyHelpDialog } from "./StudyHelpDialog";

const dialogProps = {
  rows: [
    { control: "cardSwipeUp", action: "RateGood" },
    { control: "flip", action: "flip" },
  ] as const,
};

const Harness: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen(true)}>
        Open study help
      </button>
      {open ? (
        <StudyHelpDialog
          {...dialogProps}
          restoreTriggerFocus={() => triggerRef.current?.focus()}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
};

afterEach(() => dismissToast());

describe("STUDY-CONTROLS-04 STUDY-CONTROLS-17 STUDY-CONTROLS-18 StudyHelpDialog", () => {
  it("provides modal semantics and focuses a safe close control", async () => {
    // Given: Prepare `user` and any shared test state below.
    const user = userEvent.setup();
    render(<Harness />);

    // When: Exercise `user.click` with the prepared inputs.
    await user.click(screen.getByRole("button", { name: "Open study help" }));

    const dialog = screen.getByRole("dialog", { name: "Study controls" });
    // Then: Verify the expected result in the assertions below.
    expect(dialog).toHaveAccessibleDescription(
      "Review the controls available for this study session and their current actions."
    );
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("Arrow Up / Swipe Up")).toBeVisible();
    expect(screen.getByRole("button", { name: "Close help" })).toHaveFocus();
  });

  it("traps focus, closes on Escape, and returns focus to the Help trigger after a pointer click", async () => {
    // Given: Prepare `trigger` and any shared test state below.
    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Open study help" });
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(trigger);
    // Then: Verify the expected result in the assertions below.
    expect(trigger).not.toHaveFocus();

    const close = screen.getByRole("button", { name: "Close help" });
    expect(fireEvent.keyDown(close, { key: "Tab" })).toBe(false);
    expect(close).toHaveFocus();
    expect(fireEvent.keyDown(close, { key: "Tab", shiftKey: true })).toBe(false);
    expect(close).toHaveFocus();

    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(close, { key: "Escape" });

    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("keeps a persistent Toast non-interactive and restores programmatic dismissal inside the modal", async () => {
    // Given: Prepare `user`, `trigger`, `toastId` and any shared test state below.
    const user = userEvent.setup();
    render(
      <>
        <Harness />
        <ToastViewport />
      </>
    );
    const trigger = screen.getByRole("button", { name: "Open study help" });
    trigger.focus();
    let toastId = 0;
    act(() => {
      toastId = showToast({ messageKey: "toast.saveFailure", tone: "error", durationMs: null });
    });
    expect(screen.getByRole("button", { name: "Dismiss notification" })).toBeVisible();

    // When: Exercise `user.click` with the prepared inputs.
    await user.click(trigger);

    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByRole("button", { name: "Dismiss notification" })).not.toBeInTheDocument();
    const close = screen.getByRole("button", { name: "Close help" });
    expect(close).toHaveFocus();

    // When: Exercise `trigger.focus` with the prepared inputs.
    trigger.focus();
    act(() => dismissToast(toastId));
    // Then: Verify the expected result in the assertions below.
    expect(close).toHaveFocus();
  });

  it("restores persistent Toast interaction after Strict Mode modal cleanup", async () => {
    // Given: Prepare `user` and any shared test state below.
    const user = userEvent.setup();
    render(
      <React.StrictMode>
        <Harness />
        <ToastViewport />
      </React.StrictMode>
    );
    act(() => {
      showToast({ messageKey: "toast.saveFailure", tone: "error", durationMs: null });
    });

    // When: Exercise `user.click` with the prepared inputs.
    await user.click(screen.getByRole("button", { name: "Open study help" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByRole("button", { name: "Dismiss notification" })).not.toBeInTheDocument();

    // When: Exercise `user.click` with the prepared inputs.
    await user.click(screen.getByRole("button", { name: "Close help" }));

    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dismiss notification" })).toBeVisible();
  });
});
