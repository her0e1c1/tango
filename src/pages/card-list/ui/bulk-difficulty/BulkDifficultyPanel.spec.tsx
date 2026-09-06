import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";

import { BulkDifficultyPanel } from "./BulkDifficultyPanel";

const defaultProps = {
  cardCount: 3,
  difficultyLowerBound: 1,
  difficultyUpperBound: 10,
  selectedDifficulty: null,
  onDifficultyChange: vi.fn(),
  onRequest: vi.fn(),
};

describe("BulkDifficultyPanel [CARD-19] [CARD-20]", () => {
  it("labels the visible-card target and offers every integer difficulty", () => {
    render(<BulkDifficultyPanel {...defaultProps} />);

    expect(screen.getByRole("region", { name: "Change difficulty" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Change difficulty" })).toBeInTheDocument();
    expect(screen.getByText("3 visible cards")).toBeInTheDocument();

    const select = screen.getByRole("combobox", { name: "New difficulty" });
    expect(
      within(select)
        .getAllByRole("option")
        .map((option) => option.textContent)
    ).toEqual(["Choose difficulty", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);
    expect(screen.getByRole("button", { name: "Change difficulty" })).toBeDisabled();
  });

  it("reports integer and cleared selections before requesting the change", async () => {
    const onDifficultyChange = vi.fn();
    const onRequest = vi.fn();
    const Example = () => {
      const [selectedDifficulty, setSelectedDifficulty] = React.useState<number | null>(null);
      return (
        <BulkDifficultyPanel
          {...defaultProps}
          selectedDifficulty={selectedDifficulty}
          onDifficultyChange={(difficulty) => {
            onDifficultyChange(difficulty);
            setSelectedDifficulty(difficulty);
          }}
          onRequest={onRequest}
        />
      );
    };
    render(<Example />);
    const select = screen.getByRole("combobox", { name: "New difficulty" });
    const request = screen.getByRole("button", { name: "Change difficulty" });

    await userEvent.selectOptions(select, "7");
    expect(onDifficultyChange).toHaveBeenLastCalledWith(7);
    expect(request).toBeEnabled();

    await userEvent.click(request);
    expect(onRequest).toHaveBeenCalledOnce();

    await userEvent.selectOptions(select, "");
    expect(onDifficultyChange).toHaveBeenLastCalledWith(null);
    expect(request).toBeDisabled();
  });

  it("disables all controls when there are no visible cards or the list is busy", () => {
    const view = render(<BulkDifficultyPanel {...defaultProps} cardCount={0} selectedDifficulty={5} />);

    expect(screen.getByRole("combobox", { name: "New difficulty" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Change difficulty" })).toBeDisabled();

    view.rerender(<BulkDifficultyPanel {...defaultProps} selectedDifficulty={5} disabled />);
    expect(screen.getByRole("combobox", { name: "New difficulty" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Change difficulty" })).toBeDisabled();
  });
});
