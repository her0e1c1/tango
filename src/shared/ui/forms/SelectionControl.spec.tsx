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

import { Slider } from "@/shared/ui/forms/Slider";
import { Switch } from "@/shared/ui/forms/Switch";
import { Tag } from "@/shared/ui/forms/Tag";
import { Upload } from "@/shared/ui/forms/Upload";
import { UniqueSlider, UniqueSwitch } from "./SelectionControlTestComponents";

const UPLOAD_INPUT_NAME_PATTERN = /Upload a csv file/;

describe("shared selection controls", () => {
  it("forwards accessible naming props to the switch input", () => {
    render(<UniqueSwitch />);

    const input = screen.getByRole("checkbox", { name: "Dark mode" });
    expect(input.id).not.toBe("");
    expect(input).toHaveAttribute("aria-describedby", screen.getByText("Switch description").id);
  });

  it("forwards accessible naming and value text to the slider input", () => {
    render(<UniqueSlider />);

    const slider = screen.getByRole("slider", { name: "Autoplay interval" });
    expect(slider.id).not.toBe("");
    expect(slider).toHaveAttribute("aria-describedby", screen.getByText("Slider description").id);
    expect(slider).toHaveAttribute("aria-valuetext", "7 seconds");
  });

  it("keeps the slider controlled value, native handlers, and input ref", () => {
    const ref = createRef<HTMLInputElement>();
    const onChange = vi.fn();
    const onBlur = vi.fn();
    render(<Slider ref={ref} min={0} max={10} name="confidence" value="4" onChange={onChange} onBlur={onBlur} />);

    const input = screen.getByRole("slider");
    expect(input).toHaveValue("4");
    expect(input).toHaveAttribute("name", "confidence");
    expect(ref.current).toBe(input);
    fireEvent.change(input, { target: { value: "7" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledOnce();
    expect(onBlur).toHaveBeenCalledOnce();
  });

  it("keeps the switch checked state, native value, handlers, and input ref", () => {
    const ref = createRef<HTMLInputElement>();
    const onChange = vi.fn();
    const onBlur = vi.fn();
    render(<Switch checked ref={ref} name="published" value="yes" onChange={onChange} onBlur={onBlur} />);

    const input = screen.getByRole("checkbox");
    expect(input).toBeChecked();
    expect(input).toHaveAttribute("value", "yes");
    expect(ref.current).toBe(input);
    fireEvent.click(input);
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledOnce();
    expect(onBlur).toHaveBeenCalledOnce();
  });

  it("shows tag selection through native checked state", () => {
    render(<Tag checked label="Biology" />);

    const input = screen.getByRole("checkbox", { name: "Biology" });
    expect(input).toBeChecked();
    expect(input).toHaveClass("peer", "sr-only");
  });

  it("lets native checked state drive the marker for uncontrolled tags", () => {
    const onChange = vi.fn();
    render(<Tag label="Biology" onChange={onChange} />);
    const input = screen.getByRole("checkbox", { name: "Biology" });

    expect(input).not.toBeChecked();

    fireEvent.click(input);
    expect(input).toBeChecked();
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("keeps tag native values, handlers, and input ref", () => {
    const ref = createRef<HTMLInputElement>();
    const onChange = vi.fn();
    const onBlur = vi.fn();
    render(<Tag ref={ref} label="History" name="topic" value="history" onChange={onChange} onBlur={onBlur} />);

    const input = screen.getByRole("checkbox", { name: "History" });
    expect(input).not.toBeChecked();
    expect(input).toHaveAttribute("value", "history");
    expect(ref.current).toBe(input);
    fireEvent.click(input);
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledOnce();
    expect(onBlur).toHaveBeenCalledOnce();
  });

  it("keeps switch and tag inputs keyboard focusable and activates them with Space", async () => {
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

    await user.tab();
    expect(inputs[0]).toHaveFocus();
    await user.keyboard(" ");
    expect(onSwitchChange).toHaveBeenCalledOnce();

    await user.tab();
    expect(inputs[1]).toHaveFocus();
    await user.keyboard(" ");
    expect(onTagChange).toHaveBeenCalledOnce();
  });

  it("passes the chosen native file to the unchanged upload callback", () => {
    const onChange = vi.fn();
    const file = new File(["front,back"], "biology.csv", { type: "text/csv" });
    render(<Upload onChange={onChange} />);

    const input = screen.getByLabelText("Upload a csv file") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    expect(input?.files?.[0]).toBe(file);
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(file);
  });

  it("presents the chosen file from controlled props without storing native file state", () => {
    const view = render(<Upload fileName="biology.csv" />);

    expect(screen.getByText("biology.csv")).toHaveClass("font-semibold", "text-ink");
    expect(screen.getByLabelText(UPLOAD_INPUT_NAME_PATTERN)).toHaveValue("");

    view.rerender(<Upload />);
    expect(screen.queryByText("biology.csv")).not.toBeInTheDocument();
  });

  it("keeps the slider input on a mobile touch target", () => {
    render(<Slider />);
    const input = screen.getByRole("slider");

    expect(input).toHaveClass("min-h-touch", "bg-transparent");
    expect(input).not.toHaveClass("h-2", "bg-surface-muted", "rounded-pill");
  });

  it("disables every native control with a consistent non-color cue", () => {
    const { unmount } = render(<Slider disabled value="3" />);
    const sliderInput = screen.getByRole("slider");
    expect(sliderInput).toBeDisabled();
    expect(sliderInput).toHaveClass("disabled:cursor-not-allowed", "disabled:opacity-50");
    unmount();

    const { unmount: unmountSwitch } = render(<Switch aria-label="Disabled switch" disabled checked />);
    const switchInput = screen.getByRole("checkbox", { name: "Disabled switch" });
    expect(switchInput).toBeDisabled();
    unmountSwitch();

    const { unmount: unmountTag } = render(<Tag disabled checked label="Disabled" />);
    const tagInput = screen.getByRole("checkbox", { name: "Disabled" });
    expect(tagInput).toBeDisabled();
    unmountTag();

    render(<Upload disabled />);
    const uploadInput = screen.getByLabelText("Upload a csv file");
    expect(uploadInput).toBeDisabled();
  });
});
