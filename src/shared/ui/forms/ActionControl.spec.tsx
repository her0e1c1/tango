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
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Continue
      </Button>
    );

    const button = screen.getByRole("button", { name: "Continue" });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("announces loading without color and prevents activation", () => {
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
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("retains native submit behavior", () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit">Save</Button>
      </form>
    );

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("does not announce loading for a hidden control", () => {
    render(
      <Button hidden loading>
        Continue
      </Button>
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
