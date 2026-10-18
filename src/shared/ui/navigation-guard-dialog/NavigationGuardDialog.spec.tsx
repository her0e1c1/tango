import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { showToast, ToastViewport } from "../toast";
import { dismissToast } from "@/test/utils/toast";
import { NavigationGuardDialog } from "./NavigationGuardDialog";

afterEach(() => dismissToast());

const EditorHarness = ({
  onDiscardChanges,
  onKeepEditing,
}: {
  onDiscardChanges: () => void;
  onKeepEditing: () => void;
}) => {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState("Original front");
  return (
    <>
      <label>
        Front text
        <textarea value={draft} onChange={(event) => setDraft(event.target.value)} />
      </label>
      <button type="button" onClick={() => setOpen(true)}>
        Leave editor
      </button>
      {open ? (
        <NavigationGuardDialog
          onDiscardChanges={onDiscardChanges}
          onKeepEditing={() => {
            onKeepEditing();
            setOpen(false);
          }}
        />
      ) : null}
      <button type="button">Manage decks</button>
    </>
  );
};

describe("CARD-MANAGEMENT-09 DECK-MANAGEMENT-08 CARD-MANAGEMENT-12 NavigationGuardDialog", () => {
  it("CARD-MANAGEMENT-09 keeps forward and backward Tab navigation inside the confirmation", async () => {
    // Given: Prepare `user`, `onDiscardChanges`, `onKeepEditing` and any shared test state below.
    const user = userEvent.setup();
    const onDiscardChanges = vi.fn();
    const onKeepEditing = vi.fn();
    render(<EditorHarness onDiscardChanges={onDiscardChanges} onKeepEditing={onKeepEditing} />);

    // When: Exercise `user.click` with the prepared inputs.
    await user.click(screen.getByRole("button", { name: "Leave editor" }));

    const keepEditing = screen.getByRole("button", { name: "Keep editing" });
    const discardChanges = screen.getByRole("button", { name: "Discard changes" });
    // Then: Verify the expected result in the assertions below.
    expect(keepEditing).toHaveFocus();
    // When: Exercise `user.tab` with the prepared inputs.
    await user.tab();
    // Then: Verify the expected result in the assertions below.
    expect(discardChanges).toHaveFocus();
    // When: Exercise `user.tab` with the prepared inputs.
    await user.tab();
    // Then: Verify the expected result in the assertions below.
    expect(keepEditing).toHaveFocus();
    // When: Exercise `user.tab` with the prepared inputs.
    await user.tab({ shift: true });
    // Then: Verify the expected result in the assertions below.
    expect(discardChanges).toHaveFocus();
    // When: Exercise `user.tab` with the prepared inputs.
    await user.tab({ shift: true });
    // Then: Verify the expected result in the assertions below.
    expect(keepEditing).toHaveFocus();
    expect(onDiscardChanges).not.toHaveBeenCalled();
    expect(onKeepEditing).not.toHaveBeenCalled();
  });

  it("CARD-MANAGEMENT-09 keeps the draft and restores editor focus when Escape cancels leaving", async () => {
    // Given: Prepare `user`, `onDiscardChanges`, `onKeepEditing` and any shared test state below.
    const user = userEvent.setup();
    const onDiscardChanges = vi.fn();
    const onKeepEditing = vi.fn();
    render(<EditorHarness onDiscardChanges={onDiscardChanges} onKeepEditing={onKeepEditing} />);
    const draft = screen.getByRole("textbox", { name: "Front text" });
    // When: Exercise `user.clear` with the prepared inputs.
    await user.clear(draft);
    await user.type(draft, "Unsaved front");
    const trigger = screen.getByRole("button", { name: "Leave editor" });
    await user.click(trigger);
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("alertdialog", { name: "Discard unsaved changes?" })).toBeVisible();

    // When: Exercise `user.keyboard` with the prepared inputs.
    await user.keyboard("{Escape}");

    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(onKeepEditing).toHaveBeenCalledOnce();
    expect(onDiscardChanges).not.toHaveBeenCalled();
    expect(draft).toHaveValue("Unsaved front");
    expect(trigger).toHaveFocus();
  });

  it("renders a custom description when provided", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    render(
      <NavigationGuardDialog
        description="Custom in-progress explanation"
        onDiscardChanges={vi.fn()}
        onKeepEditing={vi.fn()}
      />
    );
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("Custom in-progress explanation")).toBeVisible();
    expect(screen.getByRole("alertdialog", { name: "Discard unsaved changes?" })).toHaveAccessibleDescription(
      "Custom in-progress explanation"
    );
  });
  it("keeps a persistent Toast non-interactive and restores replacement focus inside the modal", async () => {
    // Given: Prepare `user`, `Harness`, `trigger` and any shared test state below.
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
      showToast({ messageKey: "toast.saveFailure", tone: "error", durationMs: null });
    });
    expect(screen.getByRole("button", { name: "Dismiss notification" })).toBeVisible();

    // When: Exercise `user.click` with the prepared inputs.
    await user.click(trigger);

    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByRole("button", { name: "Dismiss notification" })).not.toBeInTheDocument();
    const keepEditing = screen.getByRole("button", { name: "Keep editing" });
    expect(keepEditing).toHaveFocus();

    // When: Exercise `trigger.focus` with the prepared inputs.
    trigger.focus();
    act(() => {
      showToast({ messageKey: "cardForm.toast.createFailure", tone: "error", durationMs: null });
    });
    // Then: Verify the expected result in the assertions below.
    expect(keepEditing).toHaveFocus();
    expect(screen.getByText("Unable to create this card. Try again.")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Dismiss notification" })).not.toBeInTheDocument();
  });
});
