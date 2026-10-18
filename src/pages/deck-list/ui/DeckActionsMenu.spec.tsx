/**
 * @file Verifies the Deck List Page's actions menu behavior.
 * The examples make the expected behavior concrete with cases such as "opens an accessible menu
 * and routes each action", "omits Restart for inactive decks", "supports arrow navigation and
 * returns focus to the trigger on Escape".
 */

import * as React from "react";
import { act, fireEvent, render, waitFor, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { DeckActionsMenu } from "./DeckActionsMenu";

type ControlledMenuProps = Omit<React.ComponentProps<typeof DeckActionsMenu>, "open" | "onToggle" | "onClose">;

/**
 * Renders the test-only Controlled Menu component with controlled state or providers.
 * Individual tests reuse it to exercise realistic interactions without repeating setup code.
 */
const ControlledMenu: React.FC<ControlledMenuProps> = (props) => {
  const [open, setOpen] = React.useState(false);
  return (
    <DeckActionsMenu
      {...props}
      open={open}
      onToggle={() => setOpen((value) => !value)}
      onClose={() => setOpen(false)}
    />
  );
};

/**
 * Renders the test-only Disableable Menu component with controlled state or providers.
 * Individual tests reuse it to exercise realistic interactions without repeating setup code.
 */
const DisableableMenu: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const [disabled, setDisabled] = React.useState(false);
  return (
    <>
      <button type="button" onClick={() => setDisabled((value) => !value)}>
        Toggle disabled
      </button>
      <DeckActionsMenu
        deckName="Physics"
        open={open}
        disabled={disabled}
        onToggle={() => setOpen((value) => !value)}
        onClose={() => setOpen(false)}
      />
    </>
  );
};

describe("STUDY-SESSION-10 NAVIGATION-06 NAVIGATION-08 DeckActionsMenu", () => {
  it("opens an accessible menu and routes each action", () => {
    // Given: Prepare `actions`, `trigger` and any shared test state below.
    const actions = {
      onView: vi.fn(),
      onRestart: vi.fn(),
      onDownload: vi.fn(),
      onEdit: vi.fn(),
      onDelete: vi.fn(),
    };
    render(<ControlledMenu deckName="Algebra" {...actions} />);

    const trigger = screen.getByRole("button", { name: "Open actions for Algebra" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(trigger);

    // Then: Verify the expected result in the assertions below.
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menu", { name: "Actions for Algebra" })).toBeInTheDocument();
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(screen.getByRole("menuitem", { name: "View" }));
    // Then: Verify the expected result in the assertions below.
    expect(actions.onView).toHaveBeenCalledOnce();
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("menuitem", { name: "Restart" }));
    // Then: Verify the expected result in the assertions below.
    expect(actions.onRestart).toHaveBeenCalledOnce();

    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("menuitem", { name: "Download" }));
    // Then: Verify the expected result in the assertions below.
    expect(actions.onDownload).toHaveBeenCalledOnce();

    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    // Then: Verify the expected result in the assertions below.
    expect(actions.onEdit).toHaveBeenCalledOnce();

    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(trigger);
    const deleteItem = screen.getByRole("menuitem", { name: "Delete" });
    fireEvent.click(deleteItem);
    // Then: Verify the expected result in the assertions below.
    expect(actions.onDelete).toHaveBeenCalledOnce();
  });

  it("omits Restart for inactive decks", () => {
    // Given: Use this case's inputs and any shared test setup.
    render(<ControlledMenu deckName="History" />);

    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(screen.getByRole("button", { name: "Open actions for History" }));

    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByRole("menuitem", { name: "Restart" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual([
      "View",
      "Download",
      "Edit",
      "Study history",
      "Delete",
      "Close menu",
    ]);
  });

  it("supports arrow navigation and returns focus to the trigger on Escape", async () => {
    // Given: Prepare `trigger` and any shared test state below.
    render(<ControlledMenu deckName="Design" onRestart={vi.fn()} />);
    const trigger = screen.getByRole("button", { name: "Open actions for Design" });

    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(trigger);
    const view = screen.getByRole("menuitem", { name: "View" });
    const restart = screen.getByRole("menuitem", { name: "Restart" });
    // Then: Verify the expected result in the assertions below.
    await waitFor(() => expect(view).toHaveFocus());

    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(view, { key: "ArrowDown" });
    // Then: Verify the expected result in the assertions below.
    expect(restart).toHaveFocus();
    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(restart, { key: "Escape" });

    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("keeps management actions active when an ambiguous blur settles inside the menu", async () => {
    // Given: Prepare `actions`, `trigger` and any shared test state below.
    const actions = {
      onDownload: vi.fn(),
      onEdit: vi.fn(),
      onDelete: vi.fn(),
    };
    render(<ControlledMenu deckName="Biology" {...actions} />);
    const trigger = screen.getByRole("button", { name: "Open actions for Biology" });

    for (const [label, action] of [
      ["Download", actions.onDownload],
      ["Edit", actions.onEdit],
      ["Delete", actions.onDelete],
    ] as const) {
      // Given: Use the current iteration or branch inputs from the enclosing case.
      // When: Exercise `fireEvent.click` with the prepared inputs.
      fireEvent.click(trigger);
      const view = screen.getByRole("menuitem", { name: "View" });
      const item = screen.getByRole("menuitem", { name: label });
      // biome-ignore lint/performance/noAwaitInLoops: Each action reuses the same controlled menu and must finish in order.
      // Then: Verify the expected result in the assertions below.
      await waitFor(() => expect(view).toHaveFocus());

      // When: Exercise `act` with the prepared inputs.
      act(() => {
        view.blur();
        item.focus();
      });
      fireEvent.click(item);

      // Then: Verify the expected result in the assertions below.
      expect(action).toHaveBeenCalledOnce();
    }
  });

  it("closes when an ambiguous blur settles on an external element", async () => {
    // Given: Prepare `trigger`, `externalTarget` and any shared test state below.
    render(
      <>
        <button type="button">External focus target</button>
        <ControlledMenu deckName="Chemistry" />
      </>
    );
    const trigger = screen.getByRole("button", { name: "Open actions for Chemistry" });
    const externalTarget = screen.getByRole("button", { name: "External focus target" });

    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(trigger);
    const view = screen.getByRole("menuitem", { name: "View" });
    // Then: Verify the expected result in the assertions below.
    await waitFor(() => expect(view).toHaveFocus());

    // When: Exercise `act` with the prepared inputs.
    act(() => {
      view.blur();
      externalTarget.focus();
    });

    // Then: Verify the expected result in the assertions below.
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    expect(externalTarget).toHaveFocus();
  });

  it("disables its trigger and hides a controlled open menu", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    render(<DeckActionsMenu deckName="Physics" open disabled onToggle={vi.fn()} onClose={vi.fn()} />);

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Open actions for Physics" })).toBeDisabled();
    expect(screen.queryByRole("menu", { name: "Actions for Physics" })).not.toBeInTheDocument();
  });

  it("closes controlled state when disabled so the menu stays closed when re-enabled", () => {
    // Given: Prepare `trigger`, `toggleDisabled` and any shared test state below.
    render(<DisableableMenu />);
    const trigger = screen.getByRole("button", { name: "Open actions for Physics" });
    const toggleDisabled = screen.getByRole("button", { name: "Toggle disabled" });

    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(trigger);
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("menu", { name: "Actions for Physics" })).toBeInTheDocument();
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(toggleDisabled);
    // Then: Verify the expected result in the assertions below.
    expect(trigger).toBeDisabled();
    expect(screen.queryByRole("menu", { name: "Actions for Physics" })).not.toBeInTheDocument();

    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(toggleDisabled);

    // Then: Verify the expected result in the assertions below.
    expect(trigger).not.toBeDisabled();
    expect(screen.queryByRole("menu", { name: "Actions for Physics" })).not.toBeInTheDocument();
  });
});
