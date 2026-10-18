/**
 * @file Verifies the "shared selection controls" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "forwards accessible naming
 * props to the switch input", "forwards accessible naming and value text to the slider input",
 * "keeps the slider controlled value, native handlers, and input ref".
 */

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { Slider } from "./Slider";
import { Switch } from "./Switch";
import { Tag } from "./Tag";
import { Upload } from "./Upload";

describe("shared selection controls", () => {
  it("forwards accessible naming props to the switch input", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    render(<Switch id="dark-mode" aria-label="Dark mode" aria-describedby="dark-mode-description" />);

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("checkbox", { name: "Dark mode" })).toHaveAttribute("id", "dark-mode");
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-describedby", "dark-mode-description");
  });

  it("forwards accessible naming and value text to the slider input", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    render(
      <Slider
        id="autoplay-interval"
        aria-label="Autoplay interval"
        aria-describedby="autoplay-interval-description"
        aria-valuetext="7 seconds"
        min={0}
        max={60}
        value="7"
        onChange={() => undefined}
      />
    );

    const slider = screen.getByRole("slider", { name: "Autoplay interval" });
    // Then: Verify the expected result in the assertions below.
    expect(slider).toHaveAttribute("id", "autoplay-interval");
    expect(slider).toHaveAttribute("aria-describedby", "autoplay-interval-description");
    expect(slider).toHaveAttribute("aria-valuetext", "7 seconds");
  });

  it("keeps the slider controlled value, native handlers, and input ref", () => {
    // Given: Prepare `ref`, `onChange`, `onBlur` and any shared test state below.
    const ref = createRef<HTMLInputElement>();
    const onChange = vi.fn();
    const onBlur = vi.fn();
    render(<Slider ref={ref} min={0} max={10} name="confidence" value="4" onChange={onChange} onBlur={onBlur} />);

    const input = screen.getByRole("slider");
    expect(input).toHaveValue("4");
    expect(input).toHaveAttribute("name", "confidence");
    expect(ref.current).toBe(input);
    // When: Exercise `fireEvent.change` with the prepared inputs.
    fireEvent.change(input, { target: { value: "7" } });
    fireEvent.blur(input);
    // Then: Verify the expected result in the assertions below.
    expect(onChange).toHaveBeenCalledOnce();
    expect(onBlur).toHaveBeenCalledOnce();
  });

  it("keeps the switch checked state, native value, handlers, and input ref", () => {
    // Given: Prepare `ref`, `onChange`, `onBlur` and any shared test state below.
    const ref = createRef<HTMLInputElement>();
    const onChange = vi.fn();
    const onBlur = vi.fn();
    render(<Switch checked ref={ref} name="published" value="yes" onChange={onChange} onBlur={onBlur} />);

    const input = screen.getByRole("checkbox");
    expect(input).toBeChecked();
    expect(input).toHaveAttribute("value", "yes");
    expect(ref.current).toBe(input);
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(input);
    fireEvent.blur(input);
    // Then: Verify the expected result in the assertions below.
    expect(onChange).toHaveBeenCalledOnce();
    expect(onBlur).toHaveBeenCalledOnce();
  });

  it("shows tag selection through native checked state", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    render(<Tag checked label="Biology" />);

    const input = screen.getByRole("checkbox", { name: "Biology" });
    // Then: Verify the expected result in the assertions below.
    expect(input).toBeChecked();
  });

  it("lets native checked state drive the marker for uncontrolled tags", () => {
    // Given: Prepare `onChange`, `input` and any shared test state below.
    const onChange = vi.fn();
    render(<Tag label="Biology" onChange={onChange} />);
    const input = screen.getByRole("checkbox", { name: "Biology" });

    expect(input).not.toBeChecked();

    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(input);
    // Then: Verify the expected result in the assertions below.
    expect(input).toBeChecked();
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("keeps tag native values, handlers, and input ref", () => {
    // Given: Prepare `ref`, `onChange`, `onBlur` and any shared test state below.
    const ref = createRef<HTMLInputElement>();
    const onChange = vi.fn();
    const onBlur = vi.fn();
    render(<Tag ref={ref} label="History" name="topic" value="history" onChange={onChange} onBlur={onBlur} />);

    const input = screen.getByRole("checkbox", { name: "History" });
    expect(input).not.toBeChecked();
    expect(input).toHaveAttribute("value", "history");
    expect(ref.current).toBe(input);
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(input);
    fireEvent.blur(input);
    // Then: Verify the expected result in the assertions below.
    expect(onChange).toHaveBeenCalledOnce();
    expect(onBlur).toHaveBeenCalledOnce();
  });

  it("keeps switch and tag inputs keyboard focusable and activates them with Space", async () => {
    // Given: Prepare `user`, `onSwitchChange`, `onTagChange` and any shared test state below.
    const user = userEvent.setup();
    const onSwitchChange = vi.fn();
    const onTagChange = vi.fn();
    render(
      <>
        <Switch aria-label="Published" onChange={onSwitchChange} />
        <Tag label="History" onChange={onTagChange} />
      </>
    );
    const inputs = screen.getAllByRole("checkbox");

    // When: Exercise `user.tab` with the prepared inputs.
    await user.tab();
    // Then: Verify the expected result in the assertions below.
    expect(inputs[0]).toHaveFocus();
    // When: Exercise `user.keyboard` with the prepared inputs.
    await user.keyboard(" ");
    // Then: Verify the expected result in the assertions below.
    expect(onSwitchChange).toHaveBeenCalledOnce();

    // When: Exercise `user.tab` with the prepared inputs.
    await user.tab();
    // Then: Verify the expected result in the assertions below.
    expect(inputs[1]).toHaveFocus();
    // When: Exercise `user.keyboard` with the prepared inputs.
    await user.keyboard(" ");
    // Then: Verify the expected result in the assertions below.
    expect(onTagChange).toHaveBeenCalledOnce();
  });

  it("DECK-IMPORT-11 passes the chosen file before clearing the native selection", async () => {
    // Given: Prepare `onChange`, `file`, `input` and any shared test state below.
    const onChange = vi.fn();
    const file = new File(["front,back"], "biology.csv", { type: "text/csv" });
    render(<Upload onChange={onChange} />);

    const input = screen.getByLabelText("Upload a csv file") as HTMLInputElement;
    // When: Exercise `userEvent.upload` with the prepared inputs.
    await userEvent.upload(input, file);

    // Then: Verify the expected result in the assertions below.
    expect(input.files).toHaveLength(0);
    expect(input).toHaveValue("");
    expect(onChange).toHaveBeenCalledExactlyOnceWith(file);
  });

  it("presents the chosen file from controlled props without storing native file state", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    const view = render(<Upload fileName="biology.csv" />);

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("biology.csv")).toBeVisible();
    expect(screen.getByLabelText(/Upload a csv file/)).toHaveValue("");

    // When: Exercise `view.rerender` with the prepared inputs.
    view.rerender(<Upload />);
    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByText("biology.csv")).not.toBeInTheDocument();
  });

  it("disables every native control", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    const { unmount } = render(<Slider disabled value="3" />);
    const sliderInput = screen.getByRole("slider");
    // Then: Verify the expected result in the assertions below.
    expect(sliderInput).toBeDisabled();
    // When: Exercise `unmount` with the prepared inputs.
    unmount();

    const { unmount: unmountSwitch } = render(<Switch aria-label="Disabled switch" disabled checked />);
    const switchInput = screen.getByRole("checkbox", { name: "Disabled switch" });
    // Then: Verify the expected result in the assertions below.
    expect(switchInput).toBeDisabled();
    // When: Exercise `unmountSwitch` with the prepared inputs.
    unmountSwitch();

    const { unmount: unmountTag } = render(<Tag disabled checked label="Disabled" />);
    const tagInput = screen.getByRole("checkbox", { name: "Disabled" });
    // Then: Verify the expected result in the assertions below.
    expect(tagInput).toBeDisabled();
    // When: Exercise `unmountTag` with the prepared inputs.
    unmountTag();

    render(<Upload disabled />);
    const uploadInput = screen.getByLabelText("Upload a csv file");
    // Then: Verify the expected result in the assertions below.
    expect(uploadInput).toBeDisabled();
  });
});
