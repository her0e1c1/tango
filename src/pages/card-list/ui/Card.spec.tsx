import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { Card } from "./Card";
const card = { id: "card", frontText: "Front", tags: ["one", "two"] };
describe("Card [CARD-VIEW-01 CARD-VIEW-02]", () => {
  it("shows text and tags and routes view and edit by card ID", () => {
    // Given: Prepare `view`, `edit` and any shared test state below.
    const view = vi.fn();
    const edit = vi.fn();
    function Row() {
      const [open, setOpen] = useState(false);
      return <Card card={card} goToView={view} goToEdit={edit} menuOpen={open} onToggleMenu={() => setOpen(!open)} />;
    }
    render(<Row />);
    expect(screen.getByText("one")).toBeVisible();
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(screen.getByRole("button", { name: "View Front" }));
    // Then: Verify the expected result in the assertions below.
    expect(view).toHaveBeenCalledWith("card");
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(screen.getByRole("button", { name: "Open actions for Front" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    // Then: Verify the expected result in the assertions below.
    expect(edit).toHaveBeenCalledWith("card");
  });
  it("disables view and actions during a pending write", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    render(<Card card={card} disabled />);
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "View Front" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Open actions for Front" })).toBeDisabled();
  });
});
