/**
 * @file Verifies the "CardActionsMenu" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "renders edit and delete
 * actions", "disables the trigger and hides an open menu".
 */

import * as React from "react";
import { cleanup, fireEvent, render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CardActionsMenu } from "@/features/card/components/CardActionsMenu";

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
  afterEach(cleanup);

  it("renders edit and delete actions", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const view = render(<ControlledMenu cardText="Binary search" onEdit={onEdit} onDelete={onDelete} />);

    const trigger = view.getByRole("button", { name: "Open actions for Binary search" });
    fireEvent.click(trigger);
    expect(view.getByRole("group", { name: "Card actions for Binary search" })).toBeInTheDocument();
    expect(view.getAllByRole("menuitem").map((item) => item.textContent)).toEqual(["Edit", "Delete"]);
    fireEvent.click(view.getByRole("menuitem", { name: "Edit" }));
    expect(onEdit).toHaveBeenCalledOnce();
    fireEvent.click(trigger);
    const deleteItem = view.getByRole("menuitem", { name: "Delete" });
    expect(deleteItem).toHaveClass("text-danger");
    fireEvent.click(deleteItem);
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it("disables the trigger and hides an open menu", () => {
    const view = render(
      <CardActionsMenu cardText="Binary search" open disabled onToggle={vi.fn()} onClose={vi.fn()} />
    );

    expect(view.getByRole("button", { name: "Open actions for Binary search" })).toBeDisabled();
    expect(view.queryByRole("menu")).not.toBeInTheDocument();
  });
});
