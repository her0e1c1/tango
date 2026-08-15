/**
 * @file Verifies the "shared form layout" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "presents label, value,
 * help, and error with a clear visual hierarchy", "allows long labels and values to wrap without
 * widening the form", "keeps legacy extra copy and stacks column items on mobile".
 */

import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";

import { Form } from "@/shared/ui/forms/Form";
import { FormItem } from "@/shared/ui/forms/FormItem";

const LONG_LABEL_PATTERN = /deliberately long label/;
const WRAPPING_VALUE_PATTERN = /value that can also wrap/;

const appearsBefore = (first: Node, second: Node): boolean => {
  // biome-ignore lint/suspicious/noBitwiseOperators: compareDocumentPosition returns a DOM bitmask by contract.
  return Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);
};

describe("shared form layout", () => {
  it("presents label, value, help, and error with a clear visual hierarchy", () => {
    render(
      <Form>
        <FormItem label="Deck name" help="Shown in your library" error="A deck name is required">
          Current deck
        </FormItem>
      </Form>
    );

    const label = screen.getByText("Deck name");
    const value = screen.getByText("Current deck");
    const help = screen.getByText("Shown in your library");
    const error = screen.getByText("A deck name is required");

    expect(label).toHaveClass("font-medium", "text-ink");
    expect(value).toHaveClass("text-ink-muted");
    expect(help).toHaveClass("text-caption", "text-ink-muted");
    expect(error).toHaveClass("text-caption", "font-medium", "text-danger");
    expect(appearsBefore(label, value)).toBe(true);
    expect(appearsBefore(value, help)).toBe(true);
    expect(appearsBefore(help, error)).toBe(true);
  });

  it("allows long labels and values to wrap without widening the form", () => {
    render(
      <FormItem label="A deliberately long label that needs room to wrap on compact screens">
        A value that can also wrap safely
      </FormItem>
    );

    expect(screen.getByText(LONG_LABEL_PATTERN)).toHaveClass("min-w-0", "break-words", "md:basis-48");
    expect(screen.getByText(WRAPPING_VALUE_PATTERN)).toHaveClass("min-w-0", "break-words");
  });

  it("keeps legacy extra copy and stacks column items on mobile", () => {
    render(
      <FormItem col label="Maximum cards" extra="The existing extra prop remains visible">
        Slider control
      </FormItem>
    );

    expect(screen.getByText("The existing extra prop remains visible")).toHaveClass("text-caption", "text-ink-muted");
    expect(screen.getByText("Slider control")).toBeVisible();
  });
});
