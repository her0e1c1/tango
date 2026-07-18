import * as React from "react";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DeckActionsMenu } from "@/features/deck/components/DeckActionsMenu";

type ControlledMenuProps = Omit<React.ComponentProps<typeof DeckActionsMenu>, "open" | "onToggle" | "onClose">;

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

describe("DeckActionsMenu", () => {
  afterEach(cleanup);

  it("opens an accessible menu and routes each action", () => {
    const actions = {
      onRestart: vi.fn(),
      onDownload: vi.fn(),
      onEdit: vi.fn(),
      onDelete: vi.fn(),
    };
    const view = render(<ControlledMenu deckName="Algebra" {...actions} />);

    const trigger = view.getByRole("button", { name: "Open actions for Algebra" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(view.getByRole("menu", { name: "Actions for Algebra" })).toBeInTheDocument();
    fireEvent.click(view.getByRole("menuitem", { name: "Restart" }));
    expect(actions.onRestart).toHaveBeenCalledOnce();

    fireEvent.click(trigger);
    fireEvent.click(view.getByRole("menuitem", { name: "Download" }));
    expect(actions.onDownload).toHaveBeenCalledOnce();

    fireEvent.click(trigger);
    fireEvent.click(view.getByRole("menuitem", { name: "Edit" }));
    expect(actions.onEdit).toHaveBeenCalledOnce();

    fireEvent.click(trigger);
    const deleteItem = view.getByRole("menuitem", { name: "Delete" });
    expect(deleteItem).toHaveClass("text-danger");
    fireEvent.click(deleteItem);
    expect(actions.onDelete).toHaveBeenCalledOnce();
  });

  it("omits Restart for inactive decks", () => {
    const view = render(<ControlledMenu deckName="History" />);

    fireEvent.click(view.getByRole("button", { name: "Open actions for History" }));

    expect(view.queryByRole("menuitem", { name: "Restart" })).not.toBeInTheDocument();
    expect(view.getAllByRole("menuitem").map((item) => item.textContent)).toEqual(["Download", "Edit", "Delete"]);
  });

  it("supports arrow navigation and returns focus to the trigger on Escape", async () => {
    const view = render(<ControlledMenu deckName="Design" onRestart={vi.fn()} />);
    const trigger = view.getByRole("button", { name: "Open actions for Design" });

    fireEvent.click(trigger);
    const restart = view.getByRole("menuitem", { name: "Restart" });
    const download = view.getByRole("menuitem", { name: "Download" });
    await waitFor(() => expect(restart).toHaveFocus());

    fireEvent.keyDown(restart, { key: "ArrowDown" });
    expect(download).toHaveFocus();
    fireEvent.keyDown(download, { key: "Escape" });

    expect(view.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("keeps management actions active when an ambiguous blur settles inside the menu", async () => {
    const actions = {
      onDownload: vi.fn(),
      onEdit: vi.fn(),
      onDelete: vi.fn(),
    };
    const view = render(<ControlledMenu deckName="Biology" {...actions} />);
    const trigger = view.getByRole("button", { name: "Open actions for Biology" });

    for (const [label, action] of [
      ["Download", actions.onDownload],
      ["Edit", actions.onEdit],
      ["Delete", actions.onDelete],
    ] as const) {
      fireEvent.click(trigger);
      const download = view.getByRole("menuitem", { name: "Download" });
      const item = view.getByRole("menuitem", { name: label });
      await waitFor(() => expect(download).toHaveFocus());

      await act(async () => {
        download.blur();
        item.focus();
      });
      fireEvent.click(item);

      expect(action).toHaveBeenCalledOnce();
    }
  });

  it("closes when an ambiguous blur settles on an external element", async () => {
    const view = render(
      <>
        <button type="button">External focus target</button>
        <ControlledMenu deckName="Chemistry" />
      </>
    );
    const trigger = view.getByRole("button", { name: "Open actions for Chemistry" });
    const externalTarget = view.getByRole("button", { name: "External focus target" });

    fireEvent.click(trigger);
    const download = view.getByRole("menuitem", { name: "Download" });
    await waitFor(() => expect(download).toHaveFocus());

    await act(async () => {
      download.blur();
      externalTarget.focus();
    });

    await waitFor(() => expect(view.queryByRole("menu")).not.toBeInTheDocument());
    expect(externalTarget).toHaveFocus();
  });
});
