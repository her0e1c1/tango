/**
 * @file Verifies the ScoreRange component's native selection and compatibility behavior.
 */

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { ScoreRange } from "./ScoreRange";

const numericOptionValues = (select: HTMLElement): string[] =>
  within(select)
    .getAllByRole("option")
    .map((option) => (option as HTMLOptionElement).value)
    .filter(Boolean);

describe("ScoreRange", () => {
  it("offers No limit and scores from −10 through 10 with accessible labels", () => {
    render(<ScoreRange maximum={null} minimum={null} onMaximumChange={vi.fn()} onMinimumChange={vi.fn()} />);

    const minimum = screen.getByRole("combobox", { name: "Minimum score" });
    const maximum = screen.getByRole("combobox", { name: "Maximum score" });

    expect(minimum).toHaveValue("");
    expect(maximum).toHaveValue("");
    expect(within(minimum).getByRole("option", { name: "No limit" })).toHaveValue("");
    expect(within(maximum).getByRole("option", { name: "No limit" })).toHaveValue("");
    expect(numericOptionValues(minimum)).toEqual(Array.from({ length: 21 }, (_, index) => String(index - 10)));
    expect(numericOptionValues(maximum)).toEqual(Array.from({ length: 21 }, (_, index) => String(index - 10)));
    expect(minimum).toHaveAccessibleDescription("Include cards at or above this score.");
    expect(maximum).toHaveAccessibleDescription("Include cards at or below this score.");
    expect(screen.getByText("Any score")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear limits" })).toBeDisabled();
  });

  it("reports native selections and summarizes two-sided and one-sided limits", async () => {
    const onMinimumChange = vi.fn();
    const onMaximumChange = vi.fn();
    const view = render(
      <ScoreRange maximum={4} minimum={-2} onMaximumChange={onMaximumChange} onMinimumChange={onMinimumChange} />
    );

    expect(screen.getByText("−2 to 4")).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Minimum score" }), "-1");
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Maximum score" }), "3");
    expect(onMinimumChange).toHaveBeenCalledWith(-1);
    expect(onMaximumChange).toHaveBeenCalledWith(3);

    view.rerender(
      <ScoreRange maximum={null} minimum={-2} onMaximumChange={onMaximumChange} onMinimumChange={onMinimumChange} />
    );
    expect(screen.getByText("−2 and above")).toBeInTheDocument();

    view.rerender(
      <ScoreRange maximum={4} minimum={null} onMaximumChange={onMaximumChange} onMinimumChange={onMinimumChange} />
    );
    expect(screen.getByText("4 and below")).toBeInTheDocument();
  });

  it("preserves saved scores outside the standard integer choices", () => {
    render(<ScoreRange maximum={14.25} minimum={-12.5} onMaximumChange={vi.fn()} onMinimumChange={vi.fn()} />);

    const minimum = screen.getByRole("combobox", { name: "Minimum score" });
    const maximum = screen.getByRole("combobox", { name: "Maximum score" });

    expect(minimum).toHaveValue("-12.5");
    expect(maximum).toHaveValue("14.25");
    expect(within(minimum).getByRole("option", { name: "−12.5" })).toBeInTheDocument();
    expect(within(maximum).getByRole("option", { name: "14.25" })).toBeInTheDocument();
    expect(screen.getByText("−12.5 to 14.25")).toBeInTheDocument();
  });

  it("limits new choices to a valid range while retaining the active choices", () => {
    render(<ScoreRange maximum={4} minimum={-2} onMaximumChange={vi.fn()} onMinimumChange={vi.fn()} />);

    const minimumValues = numericOptionValues(screen.getByRole("combobox", { name: "Minimum score" }));
    const maximumValues = numericOptionValues(screen.getByRole("combobox", { name: "Maximum score" }));

    expect(minimumValues).toEqual(Array.from({ length: 15 }, (_, index) => String(index - 10)));
    expect(maximumValues).toEqual(Array.from({ length: 13 }, (_, index) => String(index - 2)));
  });

  it("clears both limits through the existing callbacks", async () => {
    const onMinimumChange = vi.fn();
    const onMaximumChange = vi.fn();
    render(<ScoreRange maximum={4} minimum={-2} onMaximumChange={onMaximumChange} onMinimumChange={onMinimumChange} />);

    await userEvent.click(screen.getByRole("button", { name: "Clear limits" }));

    expect(onMinimumChange).toHaveBeenCalledWith(null);
    expect(onMaximumChange).toHaveBeenCalledWith(null);
  });

  it("shows an invalid saved range without mutating it and allows both recovery paths", async () => {
    const onMinimumChange = vi.fn();
    const onMaximumChange = vi.fn();
    const view = render(
      <ScoreRange maximum={3} minimum={5} onMaximumChange={onMaximumChange} onMinimumChange={onMinimumChange} />
    );

    const minimum = screen.getByRole("combobox", { name: "Minimum score" });
    const maximum = screen.getByRole("combobox", { name: "Maximum score" });
    expect(screen.getByRole("alert")).toHaveTextContent("Minimum score must not be greater than maximum score.");
    expect(minimum).toHaveValue("5");
    expect(maximum).toHaveValue("3");
    expect(minimum).toHaveAccessibleDescription(/Minimum score must not be greater/);
    expect(maximum).toHaveAccessibleDescription(/Minimum score must not be greater/);
    expect(onMinimumChange).not.toHaveBeenCalled();
    expect(onMaximumChange).not.toHaveBeenCalled();
    expect(numericOptionValues(minimum)).toContain("3");
    expect(numericOptionValues(minimum)).toContain("5");
    expect(numericOptionValues(minimum)).not.toContain("4");
    expect(numericOptionValues(maximum)).toContain("3");
    expect(numericOptionValues(maximum)).toContain("5");
    expect(numericOptionValues(maximum)).not.toContain("4");

    await userEvent.selectOptions(minimum, "3");
    expect(onMinimumChange).toHaveBeenCalledWith(3);
    await userEvent.selectOptions(maximum, "");
    expect(onMaximumChange).toHaveBeenCalledWith(null);

    view.rerender(
      <ScoreRange maximum={3} minimum={3} onMaximumChange={onMaximumChange} onMinimumChange={onMinimumChange} />
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
