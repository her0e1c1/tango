/**
 * @file Verifies the "DeckActionsMenu" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "opens an accessible menu
 * and routes each action", "omits Restart for inactive decks", "supports arrow navigation and
 * returns focus to the trigger on Escape".
 */

import * as React from "react";
import { fireEvent, render, waitFor, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { DeckActionsMenu } from "./DeckActionsMenu";
import { actAsync } from "@/test/act";

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

describe("DeckActionsMenu", () => {
  it("opens an accessible menu and routes each action", () => {
    const actions = {
      onRestart: vi.fn(),
      onDownload: vi.fn(),
      onEdit: vi.fn(),
      onDelete: vi.fn(),
    };
    render(<ControlledMenu deckName="Algebra" {...actions} />);

    const trigger = screen.getByRole("button", { name: "Open actions for Algebra" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menu", { name: "Actions for Algebra" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("menuitem", { name: "Restart" }));
    expect(actions.onRestart).toHaveBeenCalledOnce();

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("menuitem", { name: "Download" }));
    expect(actions.onDownload).toHaveBeenCalledOnce();

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(actions.onEdit).toHaveBeenCalledOnce();

    fireEvent.click(trigger);
    const deleteItem = screen.getByRole("menuitem", { name: "Delete" });
    expect(deleteItem).toHaveClass("text-danger");
    fireEvent.click(deleteItem);
    expect(actions.onDelete).toHaveBeenCalledOnce();
  });

  it("omits Restart for inactive decks", () => {
    render(<ControlledMenu deckName="History" />);

    fireEvent.click(screen.getByRole("button", { name: "Open actions for History" }));

    expect(screen.queryByRole("menuitem", { name: "Restart" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual(["Download", "Edit", "Delete"]);
  });

  it("supports arrow navigation and returns focus to the trigger on Escape", async () => {
    render(<ControlledMenu deckName="Design" onRestart={vi.fn()} />);
    const trigger = screen.getByRole("button", { name: "Open actions for Design" });

    fireEvent.click(trigger);
    const restart = screen.getByRole("menuitem", { name: "Restart" });
    const download = screen.getByRole("menuitem", { name: "Download" });
    await waitFor(() => expect(restart).toHaveFocus());

    fireEvent.keyDown(restart, { key: "ArrowDown" });
    expect(download).toHaveFocus();
    fireEvent.keyDown(download, { key: "Escape" });

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("keeps management actions active when an ambiguous blur settles inside the menu", async () => {
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
      fireEvent.click(trigger);
      const download = screen.getByRole("menuitem", { name: "Download" });
      const item = screen.getByRole("menuitem", { name: label });
      await waitFor(() => expect(download).toHaveFocus());

      await actAsync(async () => {
        download.blur();
        item.focus();
      });
      fireEvent.click(item);

      expect(action).toHaveBeenCalledOnce();
    }
  });

  it("closes when an ambiguous blur settles on an external element", async () => {
    render(
      <>
        <button type="button">External focus target</button>
        <ControlledMenu deckName="Chemistry" />
      </>
    );
    const trigger = screen.getByRole("button", { name: "Open actions for Chemistry" });
    const externalTarget = screen.getByRole("button", { name: "External focus target" });

    fireEvent.click(trigger);
    const download = screen.getByRole("menuitem", { name: "Download" });
    await waitFor(() => expect(download).toHaveFocus());

    await actAsync(async () => {
      download.blur();
      externalTarget.focus();
    });

    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    expect(externalTarget).toHaveFocus();
  });

  it("disables its trigger and hides a controlled open menu", () => {
    render(<DeckActionsMenu deckName="Physics" open disabled onToggle={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Open actions for Physics" })).toBeDisabled();
    expect(screen.queryByRole("menu", { name: "Actions for Physics" })).not.toBeInTheDocument();
  });

  it("closes controlled state when disabled so the menu stays closed when re-enabled", () => {
    render(<DisableableMenu />);
    const trigger = screen.getByRole("button", { name: "Open actions for Physics" });
    const toggleDisabled = screen.getByRole("button", { name: "Toggle disabled" });

    fireEvent.click(trigger);
    expect(screen.getByRole("menu", { name: "Actions for Physics" })).toBeInTheDocument();
    fireEvent.click(toggleDisabled);
    expect(trigger).toBeDisabled();
    expect(screen.queryByRole("menu", { name: "Actions for Physics" })).not.toBeInTheDocument();

    fireEvent.click(toggleDisabled);

    expect(trigger).not.toBeDisabled();
    expect(screen.queryByRole("menu", { name: "Actions for Physics" })).not.toBeInTheDocument();
  });
});
