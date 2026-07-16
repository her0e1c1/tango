import { cleanup, fireEvent, render } from "@testing-library/react";
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

  it("groups score controls and preserves their values and callbacks", async () => {
    const props = createProps();
    const view = render(<DeckStartForm {...props} />);

    expect(view.container.querySelector("fieldset, legend")).not.toBeInTheDocument();
    expect(view.getByText("score range -2~4").parentElement).toHaveClass("bg-surface");
    const maxSwitch = view.container.querySelector("input[name='maximum-enabled']") as HTMLInputElement;
    const minSwitch = view.container.querySelector("input[name='minimum-enabled']") as HTMLInputElement;
    const maxSlider = view.container.querySelector("input[name='maximum']") as HTMLInputElement;
    const minSlider = view.container.querySelector("input[name='minimum']") as HTMLInputElement;
    expect(maxSwitch).toBeChecked();
    expect(minSwitch).toBeChecked();
    expect(maxSlider).toHaveAttribute("min", "-10");
    expect(maxSlider).toHaveAttribute("max", "10");
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

  it.each([
    [4, -2, "score range -2~4"],
    [null, -2, "score range -2~"],
    [4, null, "score range ~4"],
    [null, null, "score range"],
  ])("renders the score range text for max %s and min %s", (scoreMax, scoreMin, label) => {
    render(<DeckStartForm {...createProps()} scoreMax={scoreMax} scoreMin={scoreMin} />);
    expect(document.querySelector("fieldset, legend")).not.toBeInTheDocument();
    expect(document.body).toHaveTextContent(label);
  });
});
