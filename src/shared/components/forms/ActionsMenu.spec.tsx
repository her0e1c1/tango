import * as React from "react";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ActionsMenu, type ActionsMenuItem } from "@/shared/components/forms/ActionsMenu";

const items = (edit = vi.fn(), remove = vi.fn()): ActionsMenuItem[] => [
  { key: "edit", label: "Edit", icon: <span aria-hidden="true">E</span>, onSelect: edit },
  { key: "delete", label: "Delete", icon: <span aria-hidden="true">D</span>, danger: true, onSelect: remove },
];

type ControlledMenuProps = Omit<React.ComponentProps<typeof ActionsMenu>, "open" | "onToggle" | "onClose">;

const ControlledMenu: React.FC<ControlledMenuProps> = (props) => {
  const [open, setOpen] = React.useState(false);
  return (
    <ActionsMenu {...props} open={open} onToggle={() => setOpen((value) => !value)} onClose={() => setOpen(false)} />
  );
};

const labels = {
  groupLabel: "Card actions for Binary search",
  triggerLabel: "Open actions for Binary search",
  menuLabel: "Actions for Binary search",
};

describe("ActionsMenu", () => {
  afterEach(cleanup);

  it("renders supplied labels and runs items before returning focus", async () => {
    const edit = vi.fn();
    const remove = vi.fn();
    const view = render(<ControlledMenu {...labels} items={items(edit, remove)} />);
    const trigger = view.getByRole("button", { name: labels.triggerLabel });

    expect(view.getByRole("group", { name: labels.groupLabel })).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(trigger);
    expect(view.getByRole("menu", { name: labels.menuLabel })).toBeInTheDocument();
    fireEvent.click(view.getByRole("menuitem", { name: "Edit" }));
    expect(edit).toHaveBeenCalledOnce();
    await waitFor(() => expect(trigger).toHaveFocus());

    fireEvent.click(trigger);
    const deleteItem = view.getByRole("menuitem", { name: "Delete" });
    expect(deleteItem).toHaveClass("text-danger");
    fireEvent.click(deleteItem);
    expect(remove).toHaveBeenCalledOnce();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("supports wrapping arrows, Home, End, and Escape", async () => {
    const view = render(<ControlledMenu {...labels} items={items()} />);
    const trigger = view.getByRole("button", { name: labels.triggerLabel });
    fireEvent.click(trigger);
    const edit = view.getByRole("menuitem", { name: "Edit" });
    const remove = view.getByRole("menuitem", { name: "Delete" });

    await waitFor(() => expect(edit).toHaveFocus());
    fireEvent.keyDown(edit, { key: "ArrowUp" });
    expect(remove).toHaveFocus();
    fireEvent.keyDown(remove, { key: "Home" });
    expect(edit).toHaveFocus();
    fireEvent.keyDown(edit, { key: "End" });
    expect(remove).toHaveFocus();
    fireEvent.keyDown(remove, { key: "ArrowDown" });
    expect(edit).toHaveFocus();
    fireEvent.keyDown(edit, { key: "Escape" });
    expect(view.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("keeps the menu open when an ambiguous blur settles inside", async () => {
    const view = render(<ControlledMenu {...labels} items={items()} />);
    fireEvent.click(view.getByRole("button", { name: labels.triggerLabel }));
    const edit = view.getByRole("menuitem", { name: "Edit" });
    const remove = view.getByRole("menuitem", { name: "Delete" });
    await waitFor(() => expect(edit).toHaveFocus());

    await act(async () => {
      edit.blur();
      remove.focus();
    });

    expect(view.getByRole("menu", { name: labels.menuLabel })).toBeInTheDocument();
    expect(remove).toHaveFocus();
  });

  it("closes when an ambiguous blur settles outside", async () => {
    const view = render(
      <>
        <button type="button">External target</button>
        <ControlledMenu {...labels} items={items()} />
      </>
    );
    fireEvent.click(view.getByRole("button", { name: labels.triggerLabel }));
    const edit = view.getByRole("menuitem", { name: "Edit" });
    const external = view.getByRole("button", { name: "External target" });
    await waitFor(() => expect(edit).toHaveFocus());

    await act(async () => {
      edit.blur();
      external.focus();
    });

    expect(view.queryByRole("menu")).not.toBeInTheDocument();
    expect(external).toHaveFocus();
  });

  it("disables the trigger and hides an open menu", () => {
    const view = render(<ActionsMenu {...labels} items={items()} open disabled onToggle={vi.fn()} onClose={vi.fn()} />);

    expect(view.getByRole("button", { name: labels.triggerLabel })).toBeDisabled();
    expect(view.queryByRole("menu")).not.toBeInTheDocument();
  });
});
