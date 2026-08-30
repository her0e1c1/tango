import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";

import { StudyHelpDialog } from "./StudyHelpDialog";

const dialogProps = {
  title: "Study controls",
  description: "Current controls and actions.",
  closeLabel: "Close help",
  rows: [
    { control: "Arrow Up / Swipe Up", action: "Mark mastered and go to the next card" },
    { control: "Enter / Select Card", action: "Flip or reveal the current card" },
  ],
};

const Harness: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open study help
      </button>
      {open ? <StudyHelpDialog {...dialogProps} onClose={() => setOpen(false)} /> : null}
    </>
  );
};

describe("StudyHelpDialog", () => {
  it("provides modal semantics and focuses a safe close control", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Open study help" }));

    const dialog = screen.getByRole("dialog", { name: "Study controls" });
    expect(dialog).toHaveAccessibleDescription("Current controls and actions.");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("Arrow Up / Swipe Up")).toBeVisible();
    expect(screen.getByRole("button", { name: "Close help" })).toHaveFocus();
  });

  it("traps focus, closes on Escape, and returns focus to the Help trigger", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Open study help" });
    await user.click(trigger);

    const close = screen.getByRole("button", { name: "Close help" });
    expect(fireEvent.keyDown(close, { key: "Tab" })).toBe(false);
    expect(close).toHaveFocus();
    expect(fireEvent.keyDown(close, { key: "Tab", shiftKey: true })).toBe(false);
    expect(close).toHaveFocus();

    fireEvent.keyDown(close, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
