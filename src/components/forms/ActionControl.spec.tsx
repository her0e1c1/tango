import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Button } from "@/components/forms/Button";

afterEach(cleanup);

describe("Button action control", () => {
  it.each([
    ["primary", "bg-accent-primary"],
    ["secondary", "bg-accent-secondary"],
    ["quiet", "bg-transparent"],
    ["destructive", "bg-danger"],
  ] as const)("uses the %s semantic variant", (variant, expectedClass) => {
    render(<Button variant={variant}>Continue</Button>);

    expect(screen.getByRole("button", { name: "Continue" })).toHaveClass(expectedClass);
  });

  it.each([
    ["sm", "px-3", "text-caption"],
    ["md", "px-4", "text-body"],
    ["lg", "px-6", "text-lg"],
  ] as const)("uses the %s size with a mobile touch target", (size, paddingClass, textClass) => {
    render(<Button size={size}>Continue</Button>);

    expect(screen.getByRole("button", { name: "Continue" })).toHaveClass(
      "min-h-touch",
      "min-w-touch",
      paddingClass,
      textClass
    );
  });

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

  it.each([
    [{ primary: true }, "bg-accent-primary"],
    [{ small: true }, "px-3"],
    [{ large: true }, "px-6"],
  ] as const)("temporarily supports legacy props", (legacyProps, expectedClass) => {
    render(<Button {...legacyProps}>Legacy</Button>);

    expect(screen.getByRole("button", { name: "Legacy" })).toHaveClass(expectedClass);
  });
});
