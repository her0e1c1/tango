/**
 * @file Verifies the "Button action control" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "does not activate while
 * disabled", "announces loading without color and prevents activation", "retains native submit
 * behavior".
 */

import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { Button } from "../button";

describe("Button action control", () => {
  it("does not activate while disabled", () => {
    // Given: Prepare `onClick`, `button` and any shared test state below.
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Continue
      </Button>
    );

    const button = screen.getByRole("button", { name: "Continue" });
    expect(button).toBeDisabled();
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(button);
    // Then: Verify the expected result in the assertions below.
    expect(onClick).not.toHaveBeenCalled();
  });

  it("announces loading without color and prevents activation", () => {
    // Given: Prepare `onClick`, `button`, `status` and any shared test state below.
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Continue
      </Button>
    );

    const button = screen.getByRole("button", { name: "Continue" });
    const status = screen.getByRole("status");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent("Loading Continue");
    expect(button).not.toContainElement(status);
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(button);
    // Then: Verify the expected result in the assertions below.
    expect(onClick).not.toHaveBeenCalled();
  });

  it("retains native submit behavior", () => {
    // Given: Prepare `onSubmit` and any shared test state below.
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit">Save</Button>
      </form>
    );

    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    // Then: Verify the expected result in the assertions below.
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("does not announce loading for a hidden control", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    render(
      <Button hidden loading>
        Continue
      </Button>
    );

    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
