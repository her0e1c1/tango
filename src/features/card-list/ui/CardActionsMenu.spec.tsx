/**
 * @file Verifies the "CardActionsMenu" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "renders edit and delete
 * actions", "disables the trigger and hides an open menu".
 */

import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { CardActionsMenu } from "./CardActionsMenu";

type ControlledMenuProps = Omit<React.ComponentProps<typeof CardActionsMenu>, "open" | "onToggle" | "onClose">;

/**
 * Renders the test-only Controlled Menu component with controlled state or providers.
 * Individual tests reuse it to exercise realistic interactions without repeating setup code.
 */
const ControlledMenu: React.FC<ControlledMenuProps> = (props) => {
  const [open, setOpen] = React.useState(false);
  return (
    <CardActionsMenu
      {...props}
      open={open}
      onToggle={() => setOpen((value) => !value)}
      onClose={() => setOpen(false)}
    />
  );
};

describe("CardActionsMenu", () => {
  it("renders edit and delete actions", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<ControlledMenu cardText="Binary search" onEdit={onEdit} onDelete={onDelete} />);

    const trigger = screen.getByRole("button", { name: "Open actions for Binary search" });
    fireEvent.click(trigger);
    expect(screen.getByRole("group", { name: "Card actions for Binary search" })).toBeInTheDocument();
    expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual(["Edit", "Delete"]);
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(onEdit).toHaveBeenCalledOnce();
    fireEvent.click(trigger);
    const deleteItem = screen.getByRole("menuitem", { name: "Delete" });
    expect(deleteItem).toHaveClass("text-danger");
    fireEvent.click(deleteItem);
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it("disables the trigger and hides an open menu", () => {
    render(<CardActionsMenu cardText="Binary search" open disabled onToggle={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Open actions for Binary search" })).toBeDisabled();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
