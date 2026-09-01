/**
 * @file Verifies the DifficultyRange component's native selection and compatibility behavior.
 */

import { act, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { getI18n } from "react-i18next";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { DifficultyRange } from "./DifficultyRange";

const difficultyBounds = { lowerBound: 1, upperBound: 10 } as const;

const numericOptionValues = (select: HTMLElement): string[] =>
  within(select)
    .getAllByRole("option")
    .map((option) => (option as HTMLOptionElement).value)
    .filter(Boolean);

describe("DifficultyRange [CARD-10] [SETTINGS-04] [SWIPE-06]", () => {
  it("shows a dash for an unrestricted boundary and explains its meaning accessibly", () => {
    render(
      <DifficultyRange
        {...difficultyBounds}
        maximum={null}
        minimum={null}
        onClear={vi.fn()}
        onMaximumChange={vi.fn()}
        onMinimumChange={vi.fn()}
      />
    );

    const minimum = screen.getByRole("combobox", { name: "Minimum difficulty" });
    const maximum = screen.getByRole("combobox", { name: "Maximum difficulty" });

    expect(minimum).toHaveValue("");
    expect(maximum).toHaveValue("");
    expect(within(minimum).getByRole("option", { name: "-" })).toHaveValue("");
    expect(within(maximum).getByRole("option", { name: "-" })).toHaveValue("");
    expect(numericOptionValues(minimum)).toEqual(Array.from({ length: 10 }, (_, index) => String(index + 1)));
    expect(numericOptionValues(maximum)).toEqual(Array.from({ length: 10 }, (_, index) => String(index + 1)));
    expect(minimum).toHaveAccessibleDescription(
      "A dash means no minimum difficulty. Include cards at or above this difficulty."
    );
    expect(maximum).toHaveAccessibleDescription(
      "A dash means no maximum difficulty. Include cards at or below this difficulty."
    );
    expect(screen.queryByRole("button", { name: "Clear limits" })).not.toBeInTheDocument();
  });

  it("explains the dash while numeric boundaries are selected and reports native selections", async () => {
    const onMinimumChange = vi.fn();
    const onMaximumChange = vi.fn();
    render(
      <DifficultyRange
        {...difficultyBounds}
        maximum={8}
        minimum={3}
        onClear={vi.fn()}
        onMaximumChange={onMaximumChange}
        onMinimumChange={onMinimumChange}
      />
    );

    const minimum = screen.getByRole("combobox", { name: "Minimum difficulty" });
    const maximum = screen.getByRole("combobox", { name: "Maximum difficulty" });
    expect(minimum).toHaveAccessibleDescription(
      "A dash means no minimum difficulty. Include cards at or above this difficulty."
    );
    expect(maximum).toHaveAccessibleDescription(
      "A dash means no maximum difficulty. Include cards at or below this difficulty."
    );

    await userEvent.selectOptions(minimum, "4");
    await userEvent.selectOptions(maximum, "7");
    expect(onMinimumChange).toHaveBeenCalledWith(4);
    expect(onMaximumChange).toHaveBeenCalledWith(7);
  });

  it("preserves saved fractional difficulty values", () => {
    render(
      <DifficultyRange
        {...difficultyBounds}
        maximum={8.25}
        minimum={2.5}
        onClear={vi.fn()}
        onMaximumChange={vi.fn()}
        onMinimumChange={vi.fn()}
      />
    );

    const minimum = screen.getByRole("combobox", { name: "Minimum difficulty" });
    const maximum = screen.getByRole("combobox", { name: "Maximum difficulty" });

    expect(minimum).toHaveValue("2.5");
    expect(maximum).toHaveValue("8.25");
    expect(within(minimum).getByRole("option", { name: "2.5" })).toBeInTheDocument();
    expect(within(maximum).getByRole("option", { name: "8.25" })).toBeInTheDocument();
  });

  it("limits new choices to a valid range while retaining the active choices", () => {
    render(
      <DifficultyRange
        {...difficultyBounds}
        maximum={8}
        minimum={3}
        onClear={vi.fn()}
        onMaximumChange={vi.fn()}
        onMinimumChange={vi.fn()}
      />
    );

    const minimumValues = numericOptionValues(screen.getByRole("combobox", { name: "Minimum difficulty" }));
    const maximumValues = numericOptionValues(screen.getByRole("combobox", { name: "Maximum difficulty" }));

    expect(minimumValues).toEqual(Array.from({ length: 8 }, (_, index) => String(index + 1)));
    expect(maximumValues).toEqual(Array.from({ length: 8 }, (_, index) => String(index + 3)));
  });

  it("reports one clear action for both limits", async () => {
    const onClear = vi.fn();
    const onMinimumChange = vi.fn();
    const onMaximumChange = vi.fn();
    render(
      <DifficultyRange
        {...difficultyBounds}
        maximum={8}
        minimum={3}
        onClear={onClear}
        onMaximumChange={onMaximumChange}
        onMinimumChange={onMinimumChange}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Clear limits" }));

    expect(onClear).toHaveBeenCalledOnce();
    expect(onMinimumChange).not.toHaveBeenCalled();
    expect(onMaximumChange).not.toHaveBeenCalled();
  });

  it("keeps focus in the range controls and announces when limits are cleared", async () => {
    const ControlledDifficultyRange = () => {
      const [maximum, setMaximum] = useState<number | null>(8);
      const [minimum, setMinimum] = useState<number | null>(3);

      return (
        <DifficultyRange
          {...difficultyBounds}
          maximum={maximum}
          minimum={minimum}
          onClear={() => {
            setMaximum(null);
            setMinimum(null);
          }}
          onMaximumChange={setMaximum}
          onMinimumChange={setMinimum}
        />
      );
    };

    render(<ControlledDifficultyRange />);
    await userEvent.click(screen.getByRole("button", { name: "Clear limits" }));

    expect(screen.getByRole("combobox", { name: "Minimum difficulty" })).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent("No difficulty limits.");
    expect(screen.queryByRole("button", { name: "Clear limits" })).not.toBeInTheDocument();
  });

  it("shows an invalid saved range without mutating it and allows both recovery paths", async () => {
    const onMinimumChange = vi.fn();
    const onMaximumChange = vi.fn();
    const view = render(
      <DifficultyRange
        {...difficultyBounds}
        maximum={3}
        minimum={5}
        onClear={vi.fn()}
        onMaximumChange={onMaximumChange}
        onMinimumChange={onMinimumChange}
      />
    );

    const minimum = screen.getByRole("combobox", { name: "Minimum difficulty" });
    const maximum = screen.getByRole("combobox", { name: "Maximum difficulty" });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Minimum difficulty must not be greater than maximum difficulty."
    );
    expect(minimum).toHaveValue("5");
    expect(maximum).toHaveValue("3");
    expect(minimum).toHaveAccessibleDescription(/Minimum difficulty must not be greater/);
    expect(maximum).toHaveAccessibleDescription(/Minimum difficulty must not be greater/);
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
      <DifficultyRange
        {...difficultyBounds}
        maximum={3}
        minimum={3}
        onClear={vi.fn()}
        onMaximumChange={onMaximumChange}
        onMinimumChange={onMinimumChange}
      />
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("uses semantic boundary identifiers when the locale changes", () => {
    render(
      <DifficultyRange
        {...difficultyBounds}
        maximum={8}
        minimum={3}
        onClear={vi.fn()}
        onMaximumChange={vi.fn()}
        onMinimumChange={vi.fn()}
      />
    );
    const minimum = screen.getByRole("combobox", { name: "Minimum difficulty" });
    const maximum = screen.getByRole("combobox", { name: "Maximum difficulty" });

    act(() => {
      void getI18n().changeLanguage("ja");
    });

    expect(screen.getByRole("combobox", { name: "最小難易度" })).toBe(minimum);
    expect(screen.getByRole("combobox", { name: "最大難易度" })).toBe(maximum);
    expect(screen.getByRole("status")).toHaveTextContent("難易度範囲：3〜8。");
  });
});
