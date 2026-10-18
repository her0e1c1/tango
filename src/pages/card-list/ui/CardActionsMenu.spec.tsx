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
    // Given: Prepare `onEdit`, `onDelete`, `trigger` and any shared test state below.
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<ControlledMenu cardText="Binary search" onEdit={onEdit} onDelete={onDelete} />);

    const trigger = screen.getByRole("button", { name: "Open actions for Binary search" });
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(trigger);
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("group", { name: "Card actions for Binary search" })).toBeInTheDocument();
    expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual(["Edit", "Delete"]);
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    // Then: Verify the expected result in the assertions below.
    expect(onEdit).toHaveBeenCalledOnce();
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(trigger);
    const deleteItem = screen.getByRole("menuitem", { name: "Delete" });
    fireEvent.click(deleteItem);
    // Then: Verify the expected result in the assertions below.
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it("disables the trigger and hides an open menu", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    render(<CardActionsMenu cardText="Binary search" open disabled onToggle={vi.fn()} onClose={vi.fn()} />);

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Open actions for Binary search" })).toBeDisabled();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
