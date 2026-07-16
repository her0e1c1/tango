import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Input } from "@/shared/components/forms/Input";
import { Select } from "@/shared/components/forms/Select";
import { Textarea } from "@/shared/components/forms/Textarea";

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
  it("keeps native input values, refs, and handlers", () => {
    const inputRef = createRef<HTMLInputElement>();
    const onChange = vi.fn();
    const onBlur = vi.fn();

    render(<Input inputRef={inputRef} defaultValue="Original" name="title" onChange={onChange} onBlur={onBlur} />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("Original");
    expect(inputRef.current).toBe(input);
    fireEvent.change(input, { target: { value: "Updated" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledOnce();
    expect(onBlur).toHaveBeenCalledOnce();
  });

  it("keeps native select values, refs, and handlers", () => {
    const inputRef = createRef<HTMLSelectElement>();
    const onChange = vi.fn();
    const onBlur = vi.fn();

    render(
      <Select
        inputRef={inputRef}
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
    expect(inputRef.current).toBe(select);
    fireEvent.change(select, { target: { value: "primary" } });
    fireEvent.blur(select);
    expect(onChange).toHaveBeenCalledOnce();
    expect(onBlur).toHaveBeenCalledOnce();
  });

  it("keeps native textarea values, refs, and handlers", () => {
    const inputRef = createRef<HTMLTextAreaElement>();
    const onChange = vi.fn();
    const onBlur = vi.fn();

    render(
      <Textarea inputRef={inputRef} defaultValue="Original notes" name="notes" onChange={onChange} onBlur={onBlur} />
    );

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveValue("Original notes");
    expect(inputRef.current).toBe(textarea);
    fireEvent.change(textarea, { target: { value: "Updated notes" } });
    fireEvent.blur(textarea);
    expect(onChange).toHaveBeenCalledOnce();
    expect(onBlur).toHaveBeenCalledOnce();
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
});
