/**
 * @file Verifies the "ActionsMenu" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "renders supplied labels and
 * runs items before returning focus", "supports wrapping arrows, Home, End, and Escape", "keeps
 * menu items out of the Tab sequence and moves Tab to the next external control".
 */

import * as React from "react";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ActionsMenu, type ActionsMenuItem } from "@/components/forms/ActionsMenu";

/**
 * Provides the items test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
const items = (edit = vi.fn(), remove = vi.fn()): ActionsMenuItem[] => [
  { key: "edit", label: "Edit", icon: <span aria-hidden="true">E</span>, onSelect: edit },
  { key: "delete", label: "Delete", icon: <span aria-hidden="true">D</span>, danger: true, onSelect: remove },
];

type ControlledMenuProps = Omit<React.ComponentProps<typeof ActionsMenu>, "open" | "onToggle" | "onClose">;

/**
 * Renders the test-only Controlled Menu component with controlled state or providers.
 * Individual tests reuse it to exercise realistic interactions without repeating setup code.
 */
const ControlledMenu: React.FC<ControlledMenuProps> = (props) => {
  const [open, setOpen] = React.useState(false);
  return (
    <ActionsMenu {...props} open={open} onToggle={() => setOpen((value) => !value)} onClose={() => setOpen(false)} />
  );
};

/**
 * Renders the test-only Shared Open Menus component with controlled state or providers.
 * Individual tests reuse it to exercise realistic interactions without repeating setup code.
 */
const SharedOpenMenus: React.FC = () => {
  const [openMenu, setOpenMenu] = React.useState<"first" | "second" | null>(null);
  const menu = (id: "first" | "second") => ({
    ...labels,
    groupLabel: `${id} ${labels.groupLabel}`,
    triggerLabel: `Open ${id} actions`,
    menuLabel: `${id} ${labels.menuLabel}`,
    items: items(),
    open: openMenu === id,
    onToggle: () => setOpenMenu((current) => (current === id ? null : id)),
    onClose: () => setOpenMenu(null),
  });

  return (
    <>
      <ActionsMenu {...menu("first")} />
      <ActionsMenu {...menu("second")} />
    </>
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

  it("keeps menu items out of the Tab sequence and moves Tab to the next external control", async () => {
    const view = render(
      <>
        <button type="button">Previous control</button>
        <ControlledMenu {...labels} items={items()} />
        <button type="button">Next control</button>
      </>
    );
    fireEvent.click(view.getByRole("button", { name: labels.triggerLabel }));
    const edit = view.getByRole("menuitem", { name: "Edit" });
    const remove = view.getByRole("menuitem", { name: "Delete" });
    await waitFor(() => expect(edit).toHaveFocus());

    expect(edit).toHaveAttribute("tabindex", "-1");
    expect(remove).toHaveAttribute("tabindex", "-1");
    await act(async () => fireEvent.keyDown(edit, { key: "Tab" }));

    expect(view.queryByRole("menu")).not.toBeInTheDocument();
    expect(view.getByRole("button", { name: "Next control" })).toHaveFocus();
  });

  it("moves Shift+Tab to the previous external control before the trigger", async () => {
    const view = render(
      <>
        <button type="button">Previous control</button>
        <ControlledMenu {...labels} items={items()} />
        <button type="button">Next control</button>
      </>
    );
    fireEvent.click(view.getByRole("button", { name: labels.triggerLabel }));
    const edit = view.getByRole("menuitem", { name: "Edit" });
    await waitFor(() => expect(edit).toHaveFocus());

    await act(async () => fireEvent.keyDown(edit, { key: "Tab", shiftKey: true }));

    expect(view.queryByRole("menu")).not.toBeInTheDocument();
    expect(view.getByRole("button", { name: "Previous control" })).toHaveFocus();
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

  it("keeps Edit active when an ambiguous blur microtask runs before the click", async () => {
    const editAction = vi.fn();
    const view = render(<ControlledMenu {...labels} items={items(editAction)} />);
    const trigger = view.getByRole("button", { name: labels.triggerLabel });

    fireEvent.click(trigger);
    const edit = view.getByRole("menuitem", { name: "Edit" });
    await waitFor(() => expect(edit).toHaveFocus());

    vi.useFakeTimers({ toFake: ["setTimeout"] });
    try {
      await act(async () => {
        edit.blur();
        await Promise.resolve();
      });
      fireEvent.click(edit);

      expect(editAction).toHaveBeenCalledOnce();
    } finally {
      act(() => {
        vi.runOnlyPendingTimers();
      });
      vi.useRealTimers();
    }
  });

  it("keeps a newly opened sibling menu open after a stale blur timer runs", async () => {
    const view = render(<SharedOpenMenus />);
    fireEvent.click(view.getByRole("button", { name: "Open first actions" }));
    const firstEdit = view.getByRole("menuitem", { name: "Edit" });
    await waitFor(() => expect(firstEdit).toHaveFocus());

    vi.useFakeTimers({ toFake: ["setTimeout"] });
    try {
      await act(async () => {
        firstEdit.blur();
        fireEvent.click(view.getByRole("button", { name: "Open second actions" }));
      });

      const secondMenu = view.getByRole("menu", { name: `second ${labels.menuLabel}` });
      expect(secondMenu).toBeInTheDocument();
      act(() => vi.runOnlyPendingTimers());
      expect(secondMenu).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not close after its root unmounts during an ambiguous blur", async () => {
    const onClose = vi.fn();
    const view = render(<ActionsMenu {...labels} items={items()} open onToggle={vi.fn()} onClose={onClose} />);
    const edit = view.getByRole("menuitem", { name: "Edit" });
    edit.focus();

    vi.useFakeTimers({ toFake: ["setTimeout"] });
    try {
      act(() => edit.blur());
      view.unmount();
      act(() => vi.runOnlyPendingTimers());

      expect(onClose).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
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

    await waitFor(() => expect(view.queryByRole("menu")).not.toBeInTheDocument());
    expect(external).toHaveFocus();
  });

  it("disables the trigger and hides an open menu", () => {
    const view = render(<ActionsMenu {...labels} items={items()} open disabled onToggle={vi.fn()} onClose={vi.fn()} />);

    expect(view.getByRole("button", { name: labels.triggerLabel })).toBeDisabled();
    expect(view.queryByRole("menu")).not.toBeInTheDocument();
  });
});
