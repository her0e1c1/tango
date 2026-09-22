import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { Card } from "./Card";
const card = { id: "card", frontText: "Front", tags: ["one", "two"] };
describe("Card [CARD-VIEW-01 CARD-VIEW-02]", () => {
  it("shows text and tags and routes view and edit by card ID", () => {
    const view = vi.fn();
    const edit = vi.fn();
    function Row() {
      const [open, setOpen] = useState(false);
      return <Card card={card} goToView={view} goToEdit={edit} menuOpen={open} onToggleMenu={() => setOpen(!open)} />;
    }
    render(<Row />);
    expect(screen.getByText("one")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "View Front" }));
    expect(view).toHaveBeenCalledWith("card");
    fireEvent.click(screen.getByRole("button", { name: "Open actions for Front" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(edit).toHaveBeenCalledWith("card");
  });
  it("disables view and actions during a pending write", () => {
    render(<Card card={card} disabled />);
    expect(screen.getByRole("button", { name: "View Front" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Open actions for Front" })).toBeDisabled();
  });
});
