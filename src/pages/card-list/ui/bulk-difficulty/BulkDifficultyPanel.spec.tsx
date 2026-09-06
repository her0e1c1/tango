import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { BulkDifficultyPanel } from "./BulkDifficultyPanel";

describe("BulkDifficultyPanel [CARD-19] [CARD-20]", () => {
  it("shows all ten choices and reports a selected difficulty", async () => {
    const onDifficultyChange = vi.fn();
    const view = render(
      <BulkDifficultyPanel
        difficultyLowerBound={1}
        difficultyUpperBound={10}
        selectedDifficulty={null}
        onDifficultyChange={onDifficultyChange}
      />
    );
    expect(screen.getAllByRole("button")).toHaveLength(10);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "7" }));
    expect(onDifficultyChange).toHaveBeenCalledWith(7);
    view.rerender(
      <BulkDifficultyPanel
        difficultyLowerBound={1}
        difficultyUpperBound={10}
        selectedDifficulty={7}
        disabled
        onDifficultyChange={onDifficultyChange}
      />
    );
    expect(screen.getByRole("button", { name: "7" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "8" })).toBeDisabled();
  });
});
