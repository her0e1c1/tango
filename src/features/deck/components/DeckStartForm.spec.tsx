import { cleanup, fireEvent, render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { DeckStartForm, type DeckStartFormProps } from "@/features/deck/components/DeckStartForm";

const createProps = (): DeckStartFormProps => ({
  scoreMax: 4,
  scoreMin: -2,
  scoreMaxSwitchProps: { name: "maximum-enabled", checked: true, onChange: vi.fn() },
  scoreMinSwitchProps: { name: "minimum-enabled", checked: true, onChange: vi.fn() },
  scoreMaxSliderProps: { name: "maximum", value: "4", min: -10, max: 10, onChange: vi.fn() },
  scoreMinSliderProps: { name: "minimum", value: "-2", min: -10, max: 10, onChange: vi.fn() },
  tagFilterProps: { tags: ["one", "two"], selectedTags: ["one"], tagAndFilter: true },
});

describe("DeckStartForm", () => {
  afterEach(cleanup);

  it("labels score controls and preserves values and callbacks", async () => {
    const props = createProps();
    const view = render(<DeckStartForm {...props} />);
    const scoreRegion = view.getByRole("region", { name: "Score range" });
    const maxSwitch = within(scoreRegion).getByRole("checkbox", { name: "Enable maximum score" });
    const minSwitch = within(scoreRegion).getByRole("checkbox", { name: "Enable minimum score" });
    const maxSlider = within(scoreRegion).getByRole("slider", { name: "Maximum score value" });
    const minSlider = within(scoreRegion).getByRole("slider", { name: "Minimum score value" });

    expect(scoreRegion).toHaveClass("bg-surface");
    expect(within(scoreRegion).getByText("−2 to 4")).toBeInTheDocument();
    expect(maxSwitch).toBeChecked();
    expect(minSwitch).toBeChecked();
    expect(maxSlider).toHaveValue("4");
    expect(minSlider).toHaveValue("-2");

    await userEvent.click(maxSwitch);
    await userEvent.click(minSwitch);
    fireEvent.change(maxSlider, { target: { value: "5" } });
    fireEvent.change(minSlider, { target: { value: "-3" } });

    expect(props.scoreMaxSwitchProps.onChange).toHaveBeenCalledOnce();
    expect(props.scoreMinSwitchProps.onChange).toHaveBeenCalledOnce();
    expect(props.scoreMaxSliderProps.onChange).toHaveBeenCalledOnce();
    expect(props.scoreMinSliderProps.onChange).toHaveBeenCalledOnce();
  });

  it("shows unrestricted disabled limits", () => {
    const view = render(<DeckStartForm {...createProps()} scoreMax={null} scoreMin={null} />);
    expect(view.getByText("Any score")).toBeInTheDocument();
    expect(view.getByText("No upper limit")).toBeInTheDocument();
    expect(view.getByText("No lower limit")).toBeInTheDocument();
  });
});
