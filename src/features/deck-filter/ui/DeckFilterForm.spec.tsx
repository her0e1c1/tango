/**
 * @file Verifies the "DeckFilterForm" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "labels score controls and
 * preserves values and callbacks", "shows unrestricted disabled limits".
 */

import { fireEvent, render, within, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { DeckFilterForm } from "./DeckFilterForm";

type DeckFilterFormProps = ComponentProps<typeof DeckFilterForm>;

/**
 * Provides the create props test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
const createProps = (): DeckFilterFormProps => ({
  scoreMax: 4,
  scoreMin: -2,
  tags: ["one", "two"],
  selectedTags: ["one"],
  tagAndFilter: true,
  setScoreMax: vi.fn(),
  setScoreMin: vi.fn(),
  setSelectedTags: vi.fn(),
  setTagAndFilter: vi.fn(),
});

describe("DeckFilterForm", () => {
  it("labels score controls and preserves values and callbacks", async () => {
    const props = createProps();
    render(<DeckFilterForm {...props} />);
    const scoreRegion = screen.getByRole("region", { name: "Score range" });
    const maxSwitch = within(scoreRegion).getByRole("checkbox", { name: "Enable maximum score" });
    const minSwitch = within(scoreRegion).getByRole("checkbox", { name: "Enable minimum score" });
    const maxSlider = within(scoreRegion).getByRole("slider", { name: "Maximum score value" });
    const minSlider = within(scoreRegion).getByRole("slider", { name: "Minimum score value" });

    expect(within(scoreRegion).getByText("−2 to 4")).toBeInTheDocument();
    expect(maxSwitch).toBeChecked();
    expect(minSwitch).toBeChecked();
    expect(maxSlider).toHaveValue("4");
    expect(minSlider).toHaveValue("-2");

    await userEvent.click(maxSwitch);
    await userEvent.click(minSwitch);
    fireEvent.change(maxSlider, { target: { value: "5" } });
    fireEvent.change(minSlider, { target: { value: "-3" } });

    expect(props.setScoreMax).toHaveBeenNthCalledWith(1, null);
    expect(props.setScoreMin).toHaveBeenNthCalledWith(1, null);
    expect(props.setScoreMax).toHaveBeenNthCalledWith(2, 5);
    expect(props.setScoreMin).toHaveBeenNthCalledWith(2, -3);
  });

  it("shows unrestricted disabled limits", () => {
    render(<DeckFilterForm {...createProps()} scoreMax={null} scoreMin={null} />);
    expect(screen.getByText("Any score")).toBeInTheDocument();
    expect(screen.getByText("No upper limit")).toBeInTheDocument();
    expect(screen.getByText("No lower limit")).toBeInTheDocument();
  });
});
