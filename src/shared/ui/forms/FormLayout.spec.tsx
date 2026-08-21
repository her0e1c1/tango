/** @file Verifies form copy and reading order through rendered content. */

import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";

import { Form } from "./Form";
import { FormItem } from "./FormItem";

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

    expect(appearsBefore(label, value)).toBe(true);
    expect(appearsBefore(value, help)).toBe(true);
    expect(appearsBefore(help, error)).toBe(true);
  });

  it("keeps legacy extra copy visible", () => {
    render(
      <FormItem col label="Maximum cards" extra="The existing extra prop remains visible">
        Slider control
      </FormItem>
    );

    expect(screen.getByText("The existing extra prop remains visible")).toBeVisible();
    expect(screen.getByText("Slider control")).toBeVisible();
  });
});
