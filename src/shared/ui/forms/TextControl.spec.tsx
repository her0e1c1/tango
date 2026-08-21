/**
 * @file Verifies the "shared text controls" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "forwards an id so external
 * labels can name the input", "keeps native input values, refs, and handlers", "keeps native
 * select values, refs, and handlers".
 */

import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { Input } from "./Input";
import { Select } from "./Select";
import { Textarea } from "./Textarea";

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
    render(
      <>
        <Input aria-invalid />
        <Textarea aria-invalid />
      </>
    );

    for (const control of screen.getAllByRole("textbox")) {
      expect(control).toHaveAttribute("aria-invalid", "true");
    }
  });

  it("forwards disabled, read-only, placeholder, and type input behavior", () => {
    render(<Input disabled readOnly placeholder="Deck title" type="email" defaultValue="not-an-email" />);

    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute("readonly");
    expect(input).toHaveAttribute("placeholder", "Deck title");
    expect(input).toHaveAttribute("type", "email");
  });

  it("forwards the disabled state to a select", () => {
    render(<Select disabled defaultValue="primary" options={[{ label: "Primary", value: "primary" }]} />);

    const select = screen.getByRole("combobox");
    expect(select).toBeDisabled();
    expect(select).toHaveValue("primary");
  });

  it("forwards disabled, read-only, and placeholder textarea behavior", () => {
    render(<Textarea disabled readOnly placeholder="Card details" defaultValue="Long-form content" />);

    const textarea = screen.getByRole("textbox");
    expect(textarea).toBeDisabled();
    expect(textarea).toHaveAttribute("readonly");
    expect(textarea).toHaveAttribute("placeholder", "Card details");
  });

  it("keeps each focusable control on the native focus path", () => {
    render(
      <>
        <Input />
        <Select options={[{ label: "Primary", value: "primary" }]} />
        <Textarea />
      </>
    );

    const controls = [...screen.getAllByRole("textbox"), screen.getByRole("combobox")];
    for (const control of controls) {
      control.focus();
      expect(control).toHaveFocus();
    }
  });

  it.each([
    ["input", "textbox", () => render(<Input required defaultValue="" />)],
    [
      "select",
      "combobox",
      () => render(<Select empty required defaultValue="" options={[{ label: "Primary", value: "primary" }]} />),
    ],
    ["textarea", "textbox", () => render(<Textarea required />)],
  ])("reports native invalid state for the %s", (_name, role, renderControl) => {
    renderControl();
    const element = screen.getByRole(role);

    expect(element).toBeInvalid();
  });
});
