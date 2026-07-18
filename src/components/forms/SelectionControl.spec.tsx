import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Slider } from "@/components/forms/Slider";
import { Switch } from "@/components/forms/Switch";
import { Tag } from "@/components/forms/Tag";
import { Upload } from "@/components/forms/Upload";

afterEach(cleanup);

describe("shared selection controls", () => {
  it("forwards accessible naming props to the switch input", () => {
    render(<Switch id="dark-mode" aria-label="Dark mode" aria-describedby="dark-mode-description" />);

    expect(screen.getByRole("checkbox", { name: "Dark mode" })).toHaveAttribute("id", "dark-mode");
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-describedby", "dark-mode-description");
  });

  it("forwards accessible naming and value text to the slider input", () => {
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
    expect(slider).toHaveAttribute("id", "autoplay-interval");
    expect(slider).toHaveAttribute("aria-describedby", "autoplay-interval-description");
    expect(slider).toHaveAttribute("aria-valuetext", "7 seconds");
  });

  it("keeps the slider controlled value, native handlers, and input ref", () => {
    const ref = createRef<HTMLInputElement>();
    const onChange = vi.fn();
    const onBlur = vi.fn();
    const view = render(
      <Slider ref={ref} min={0} max={10} name="confidence" value="4" onChange={onChange} onBlur={onBlur} />
    );

    const input = view.container.querySelector<HTMLInputElement>("input[type=range]");
    if (input == null) throw new Error("Slider input is missing");
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
    const view = render(<Switch checked ref={ref} name="published" value="yes" onChange={onChange} onBlur={onBlur} />);

    const input = view.container.querySelector<HTMLInputElement>("input[type=checkbox]");
    if (input == null) throw new Error("Switch input is missing");
    expect(input).toBeChecked();
    expect(input).toHaveAttribute("value", "yes");
    expect(ref.current).toBe(input);
    fireEvent.click(input);
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledOnce();
    expect(onBlur).toHaveBeenCalledOnce();
  });

  it("shows tag selection through marker, border, and surface changes", () => {
    const view = render(<Tag checked label="Biology" />);

    const input = view.container.querySelector<HTMLInputElement>("input[type=checkbox]");
    if (input == null) throw new Error("Tag input is missing");
    const presentation = input?.nextElementSibling;
    expect(input).toBeChecked();
    expect(input).toHaveClass("peer", "sr-only");
    expect(presentation).toHaveClass(
      "rounded-control",
      "peer-checked:border-accent-primary",
      "peer-checked:bg-accent-primary/10"
    );
    expect(presentation).toHaveClass(
      "before:bg-ink-muted",
      "peer-checked:before:bg-accent-primary",
      "peer-checked:before:ring-2"
    );
  });

  it("lets native checked state drive the marker for uncontrolled tags", () => {
    const onChange = vi.fn();
    const view = render(<Tag label="Biology" onChange={onChange} />);
    const input = view.container.querySelector<HTMLInputElement>("input[type=checkbox]");
    if (input == null) throw new Error("Tag input is missing");
    const presentation = input.nextElementSibling;

    expect(input).not.toBeChecked();
    expect(presentation).toHaveClass("peer-checked:before:bg-accent-primary");

    fireEvent.click(input);
    expect(input).toBeChecked();
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("keeps tag native values, handlers, and input ref", () => {
    const ref = createRef<HTMLInputElement>();
    const onChange = vi.fn();
    const onBlur = vi.fn();
    const view = render(
      <Tag ref={ref} label="History" name="topic" value="history" onChange={onChange} onBlur={onBlur} />
    );

    const input = view.container.querySelector<HTMLInputElement>("input[type=checkbox]");
    if (input == null) throw new Error("Tag input is missing");
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
    const view = render(
      <>
        <Switch aria-label="Published" onChange={onSwitchChange} />
        <Tag label="History" onChange={onTagChange} />
      </>
    );
    const inputs = view.container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');

    await user.tab();
    expect(inputs[0]).toHaveFocus();
    await user.keyboard(" ");
    expect(onSwitchChange).toHaveBeenCalledOnce();

    await user.tab();
    expect(inputs[1]).toHaveFocus();
    await user.keyboard(" ");
    expect(onTagChange).toHaveBeenCalledOnce();
  });

  it("exposes a semantic focus-visible ring on switch and tag presentations", () => {
    const switchView = render(<Switch />);
    const switchInput = switchView.container.querySelector("input");
    expect(switchInput).toHaveClass("sr-only", "peer");
    expect(switchInput).not.toHaveClass("hidden");
    expect(switchInput?.nextElementSibling).toHaveClass(
      "peer-focus-visible:outline-none",
      "peer-focus-visible:ring-2",
      "peer-focus-visible:ring-focus"
    );
    switchView.unmount();

    const tagView = render(<Tag label="History" />);
    const tagInput = tagView.container.querySelector("input");
    expect(tagInput).toHaveClass("sr-only", "peer");
    expect(tagInput).not.toHaveClass("hidden");
    expect(tagInput?.nextElementSibling).toHaveClass(
      "peer-focus-visible:outline-none",
      "peer-focus-visible:ring-2",
      "peer-focus-visible:ring-focus"
    );
  });

  it("passes the chosen native file to the unchanged upload callback", () => {
    const onChange = vi.fn();
    const file = new File(["front,back"], "biology.csv", { type: "text/csv" });
    const view = render(<Upload onChange={onChange} />);

    const input = view.container.querySelector<HTMLInputElement>("input[type=file]");
    if (input == null) throw new Error("Upload input is missing");
    fireEvent.change(input, { target: { files: [file] } });

    expect(input?.files?.[0]).toBe(file);
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(file);
  });

  it("presents the chosen file from controlled props without storing native file state", () => {
    const view = render(<Upload fileName="biology.csv" />);

    expect(screen.getByText("biology.csv")).toHaveClass("font-semibold", "text-ink");
    expect(view.container.querySelector("input[type=file]")).toHaveValue("");

    view.rerender(<Upload />);
    expect(screen.queryByText("biology.csv")).not.toBeInTheDocument();
  });

  it("separates the slider mobile touch target from its visual rail", () => {
    const view = render(<Slider />);
    const input = view.container.querySelector("input[type=range]");
    const rail = view.container.querySelector<HTMLElement>('[aria-hidden="true"]');

    expect(input).toHaveClass("min-h-touch", "bg-transparent");
    expect(input).not.toHaveClass("h-2", "bg-surface-muted", "rounded-pill");
    expect(rail).not.toBe(input);
    expect(input?.parentElement).toContainElement(rail);
    expect(rail).toHaveClass("pointer-events-none", "h-2", "w-full", "rounded-pill", "bg-surface-muted");
  });

  it("gives the switch clickable wrapper a shared mobile touch target", () => {
    const view = render(<Switch />);

    expect(view.container.firstElementChild).toHaveClass("min-h-touch", "min-w-touch");
  });

  it("gives the tag clickable presentation a shared mobile touch target", () => {
    const view = render(<Tag label="Biology" />);
    const input = view.container.querySelector("input[type=checkbox]");

    expect(input?.nextElementSibling).toHaveClass("min-h-touch", "min-w-touch");
  });

  it("disables every native control with a consistent non-color cue", () => {
    const slider = render(<Slider disabled value="3" />);
    const sliderInput = slider.container.querySelector("input");
    expect(sliderInput).toBeDisabled();
    expect(sliderInput).toHaveClass("disabled:cursor-not-allowed", "disabled:opacity-50");
    slider.unmount();

    const switchView = render(<Switch disabled checked />);
    const switchInput = switchView.container.querySelector("input");
    expect(switchInput).toBeDisabled();
    expect(switchInput?.nextElementSibling).toHaveClass("peer-disabled:cursor-not-allowed", "peer-disabled:opacity-50");
    switchView.unmount();

    const tag = render(<Tag disabled checked label="Disabled" />);
    const tagInput = tag.container.querySelector("input");
    expect(tagInput).toBeDisabled();
    expect(tagInput?.nextElementSibling).toHaveClass("peer-disabled:cursor-not-allowed", "peer-disabled:opacity-50");
    tag.unmount();

    const upload = render(<Upload disabled />);
    const uploadInput = upload.container.querySelector("input");
    expect(uploadInput).toBeDisabled();
    expect(upload.container.firstElementChild).toHaveClass("cursor-not-allowed", "opacity-50");
  });
});
