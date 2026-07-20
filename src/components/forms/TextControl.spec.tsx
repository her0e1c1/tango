/**
 * @file Verifies the "shared text controls" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "forwards an id so external
 * labels can name the input", "keeps native input values, refs, and handlers", "keeps native
 * select values, refs, and handlers".
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Input } from "@/components/forms/Input";
import { Select } from "@/components/forms/Select";
import { Textarea } from "@/components/forms/Textarea";

afterEach(cleanup);

const sharedVisualClasses = [
  "border-border",
  "bg-surface",
  "text-ink",
  "rounded-control",
  "shadow-surface",
  "focus-visible:border-focus",
  "invalid:border-danger",
  "disabled:bg-surface-muted",
  "disabled:text-ink-muted",
  "disabled:cursor-not-allowed",
];

describe("shared text controls", () => {
  it("forwards an id so external labels can name the input", () => {
    render(
      <>
        <label htmlFor="github-token">GitHub access token</label>
        <Input id="github-token" />
      </>
    );

    expect(screen.getByRole("textbox", { name: "GitHub access token" })).toHaveAttribute("id", "github-token");
  });

  it("keeps native input values, refs, and handlers", () => {
    const ref = createRef<HTMLInputElement>();
    const onChange = vi.fn();
    const onBlur = vi.fn();

    render(<Input ref={ref} defaultValue="Original" name="title" onChange={onChange} onBlur={onBlur} />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("Original");
    expect(ref.current).toBe(input);
    fireEvent.change(input, { target: { value: "Updated" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledOnce();
    expect(onBlur).toHaveBeenCalledOnce();
  });

  it("keeps native select values, refs, and handlers", () => {
    const ref = createRef<HTMLSelectElement>();
    const onChange = vi.fn();
    const onBlur = vi.fn();

    render(
      <Select
        ref={ref}
        defaultValue="secondary"
        options={[
          { label: "Primary", value: "primary" },
          { label: "Secondary", value: "secondary" },
        ]}
        name="category"
        onChange={onChange}
        onBlur={onBlur}
      />
    );

    const select = screen.getByRole("combobox");
    expect(select).toHaveValue("secondary");
    expect(ref.current).toBe(select);
    fireEvent.change(select, { target: { value: "primary" } });
    fireEvent.blur(select);
    expect(onChange).toHaveBeenCalledOnce();
    expect(onBlur).toHaveBeenCalledOnce();
  });

  it("keeps native textarea values, refs, and handlers", () => {
    const ref = createRef<HTMLTextAreaElement>();
    const onChange = vi.fn();
    const onBlur = vi.fn();

    render(<Textarea ref={ref} defaultValue="Original notes" name="notes" onChange={onChange} onBlur={onBlur} />);

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveValue("Original notes");
    expect(ref.current).toBe(textarea);
    fireEvent.change(textarea, { target: { value: "Updated notes" } });
    fireEvent.blur(textarea);
    expect(onChange).toHaveBeenCalledOnce();
    expect(onBlur).toHaveBeenCalledOnce();
  });

  it("forwards invalid state to native text controls", () => {
    const view = render(
      <>
        <Input aria-invalid />
        <Textarea aria-invalid />
      </>
    );

    for (const control of view.container.querySelectorAll("input, textarea")) {
      expect(control).toHaveAttribute("aria-invalid", "true");
    }
  });

  it("styles input states with semantic Calm Focus roles", () => {
    render(
      <Input
        className="custom-input"
        disabled
        readOnly
        placeholder="Deck title"
        type="email"
        defaultValue="not-an-email"
      />
    );

    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute("readonly");
    expect(input).toHaveAttribute("placeholder", "Deck title");
    expect(input).toHaveClass(
      ...sharedVisualClasses,
      "placeholder:text-ink-muted",
      "read-only:bg-surface-muted",
      "custom-input"
    );
  });

  it("styles select states with semantic colors in light and dark modes", () => {
    render(
      <div className="dark">
        <Select
          className="custom-select"
          disabled
          defaultValue="primary"
          options={[{ label: "Primary", value: "primary" }]}
        />
      </div>
    );

    const select = screen.getByRole("combobox");
    expect(select).toBeDisabled();
    expect(select).toHaveClass(...sharedVisualClasses, "custom-select");
  });

  it("styles textarea states with semantic Calm Focus roles", () => {
    render(
      <Textarea
        className="custom-textarea"
        disabled
        readOnly
        placeholder="Card details"
        defaultValue="Long-form content"
      />
    );

    const textarea = screen.getByRole("textbox");
    expect(textarea).toBeDisabled();
    expect(textarea).toHaveAttribute("readonly");
    expect(textarea).toHaveAttribute("placeholder", "Card details");
    expect(textarea).toHaveClass(
      ...sharedVisualClasses,
      "placeholder:text-ink-muted",
      "read-only:bg-surface-muted",
      "custom-textarea"
    );
  });

  it("keeps each focusable control on the native focus path", () => {
    const view = render(
      <>
        <Input />
        <Select options={[{ label: "Primary", value: "primary" }]} />
        <Textarea />
      </>
    );

    for (const control of view.container.querySelectorAll<HTMLElement>("input, select, textarea")) {
      control.focus();
      expect(control).toHaveFocus();
      expect(control).toHaveClass("focus-visible:border-focus");
    }
  });

  it.each([
    ["input", () => render(<Input />)],
    ["select", () => render(<Select options={[{ label: "Primary", value: "primary" }]} />)],
    ["textarea", () => render(<Textarea />)],
  ])("gives the native %s a shared mobile touch target", (_name, renderControl) => {
    const view = renderControl();

    expect(view.container.firstElementChild).toHaveClass("min-h-touch");
  });

  it.each([
    ["input", () => render(<Input required defaultValue="" />)],
    [
      "select",
      () => render(<Select empty required defaultValue="" options={[{ label: "Primary", value: "primary" }]} />),
    ],
    ["textarea", () => render(<Textarea required />)],
  ])("makes invalid styling reachable on the native %s", (_name, renderControl) => {
    const view = renderControl();
    const element = view.container.firstElementChild;

    expect(element).toBeInvalid();
    expect(element).toHaveClass("invalid:border-danger");
  });
});
