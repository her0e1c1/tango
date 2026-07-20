/**
 * @file Verifies the "shared form layout" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "presents label, value,
 * help, and error with a clear visual hierarchy", "allows long labels and values to wrap without
 * widening the form", "keeps legacy extra copy and stacks column items on mobile".
 */

import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";

import { Form } from "@/components/forms/Form";
import { FormItem } from "@/components/forms/FormItem";

afterEach(cleanup);

describe("shared form layout", () => {
  it("presents label, value, help, and error with a clear visual hierarchy", () => {
    const view = render(
      <Form>
        <FormItem label="Deck name" help="Shown in your library" error="A deck name is required">
          Current deck
        </FormItem>
      </Form>
    );

    expect(view.container.firstElementChild).toHaveClass("w-full", "space-y-4", "px-3", "text-ink");

    const label = screen.getByText("Deck name");
    const value = screen.getByText("Current deck");
    const help = screen.getByText("Shown in your library");
    const error = screen.getByText("A deck name is required");

    expect(label).toHaveClass("font-medium", "text-ink");
    expect(value).toHaveClass("text-ink-muted");
    expect(help).toHaveClass("text-caption", "text-ink-muted");
    expect(error).toHaveClass("text-caption", "font-medium", "text-danger");
    expect(label.compareDocumentPosition(value) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(value.compareDocumentPosition(help) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(help.compareDocumentPosition(error) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("allows long labels and values to wrap without widening the form", () => {
    render(
      <FormItem label="A deliberately long label that needs room to wrap on compact screens">
        A value that can also wrap safely
      </FormItem>
    );

    expect(screen.getByText(/deliberately long label/)).toHaveClass("min-w-0", "break-words", "md:basis-48");
    expect(screen.getByText(/value that can also wrap/)).toHaveClass("min-w-0", "break-words");
  });

  it("keeps legacy extra copy and stacks column items on mobile", () => {
    const view = render(
      <FormItem col label="Maximum cards" extra="The existing extra prop remains visible">
        Slider control
      </FormItem>
    );

    expect(view.container.firstElementChild?.firstElementChild).toHaveClass("flex", "flex-col", "gap-2", "md:flex-row");
    expect(screen.getByText("The existing extra prop remains visible")).toHaveClass("text-caption", "text-ink-muted");
    expect(screen.getByText("Slider control")).toBeVisible();
  });
});
