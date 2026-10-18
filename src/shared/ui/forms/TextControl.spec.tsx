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
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    render(
      <>
        <label htmlFor="github-token">GitHub access token</label>
        <Input id="github-token" />
      </>
    );

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("textbox", { name: "GitHub access token" })).toHaveAttribute("id", "github-token");
  });

  it("keeps native input values, refs, and handlers", () => {
    // Given: Prepare `ref`, `onChange`, `onBlur` and any shared test state below.
    const ref = createRef<HTMLInputElement>();
    const onChange = vi.fn();
    const onBlur = vi.fn();

    render(<Input ref={ref} defaultValue="Original" name="title" onChange={onChange} onBlur={onBlur} />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("Original");
    expect(ref.current).toBe(input);
    // When: Exercise `fireEvent.change` with the prepared inputs.
    fireEvent.change(input, { target: { value: "Updated" } });
    fireEvent.blur(input);
    // Then: Verify the expected result in the assertions below.
    expect(onChange).toHaveBeenCalledOnce();
    expect(onBlur).toHaveBeenCalledOnce();
  });

  it("keeps native select values, refs, and handlers", () => {
    // Given: Prepare `ref`, `onChange`, `onBlur` and any shared test state below.
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
    // When: Exercise `fireEvent.change` with the prepared inputs.
    fireEvent.change(select, { target: { value: "primary" } });
    fireEvent.blur(select);
    // Then: Verify the expected result in the assertions below.
    expect(onChange).toHaveBeenCalledOnce();
    expect(onBlur).toHaveBeenCalledOnce();
  });

  it("keeps native textarea values, refs, and handlers", () => {
    // Given: Prepare `ref`, `onChange`, `onBlur` and any shared test state below.
    const ref = createRef<HTMLTextAreaElement>();
    const onChange = vi.fn();
    const onBlur = vi.fn();

    render(<Textarea ref={ref} defaultValue="Original notes" name="notes" onChange={onChange} onBlur={onBlur} />);

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveValue("Original notes");
    expect(ref.current).toBe(textarea);
    // When: Exercise `fireEvent.change` with the prepared inputs.
    fireEvent.change(textarea, { target: { value: "Updated notes" } });
    fireEvent.blur(textarea);
    // Then: Verify the expected result in the assertions below.
    expect(onChange).toHaveBeenCalledOnce();
    expect(onBlur).toHaveBeenCalledOnce();
  });

  it("forwards invalid state to native text controls", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    render(
      <>
        <Input aria-invalid />
        <Textarea aria-invalid />
      </>
    );

    for (const control of screen.getAllByRole("textbox")) {
      // Given: Use the current iteration or branch inputs from the enclosing case.
      // Then: Verify the expected result in the assertions below.
      expect(control).toHaveAttribute("aria-invalid", "true");
    }
  });

  it("forwards disabled, read-only, placeholder, and type input behavior", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    render(<Input disabled readOnly placeholder="Deck title" type="email" defaultValue="not-an-email" />);

    const input = screen.getByRole("textbox");
    // Then: Verify the expected result in the assertions below.
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute("readonly");
    expect(input).toHaveAttribute("placeholder", "Deck title");
    expect(input).toHaveAttribute("type", "email");
  });

  it("forwards the disabled state to a select", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    render(<Select disabled defaultValue="primary" options={[{ label: "Primary", value: "primary" }]} />);

    const select = screen.getByRole("combobox");
    // Then: Verify the expected result in the assertions below.
    expect(select).toBeDisabled();
    expect(select).toHaveValue("primary");
  });

  it("forwards disabled, read-only, and placeholder textarea behavior", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    render(<Textarea disabled readOnly placeholder="Card details" defaultValue="Long-form content" />);

    const textarea = screen.getByRole("textbox");
    // Then: Verify the expected result in the assertions below.
    expect(textarea).toBeDisabled();
    expect(textarea).toHaveAttribute("readonly");
    expect(textarea).toHaveAttribute("placeholder", "Card details");
  });

  it("keeps each focusable control on the native focus path", () => {
    // Given: Prepare `controls` and any shared test state below.
    render(
      <>
        <Input />
        <Select options={[{ label: "Primary", value: "primary" }]} />
        <Textarea />
      </>
    );

    const controls = [...screen.getAllByRole("textbox"), screen.getByRole("combobox")];
    for (const control of controls) {
      // Given: Use the current iteration or branch inputs from the enclosing case.
      // When: Exercise `control.focus` with the prepared inputs.
      control.focus();
      // Then: Verify the expected result in the assertions below.
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
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `renderControl` with the prepared inputs.
    renderControl();
    const element = screen.getByRole(role);

    // Then: Verify the expected result in the assertions below.
    expect(element).toBeInvalid();
  });
});
