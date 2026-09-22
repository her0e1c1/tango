import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { DeckFilterForm } from "./DeckFilterForm";
describe("CARD-LIST-ACTIONS-01 DeckFilterForm", () => {
  it("filters by tags without manual difficulty controls", async () => {
    const select = vi.fn();
    render(
      <DeckFilterForm
        tags={["one", "two"]}
        selectedTags={[]}
        tagAndFilter={false}
        setSelectedTags={select}
        setTagAndFilter={vi.fn()}
      />
    );
    await userEvent.click(screen.getByRole("checkbox", { name: "one" }));
    expect(select).toHaveBeenCalledWith(["one"]);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});
