/**
 * @file Verifies the "useButtonInteraction" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as Enter activation, Space bar
 * press/release lifecycle, blur cancellation, and event delegation isolation.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { useButtonInteraction } from "./buttonInteraction";

function TestButton({ onClick }: { onClick?: () => void }) {
  const props = useButtonInteraction(onClick);
  return <div {...props}>Test Button</div>;
}

function NestedTestButton({ onClick }: { onClick?: () => void }) {
  const props = useButtonInteraction(onClick);
  return (
    <div {...props}>
      <input aria-label="Nested input" />
    </div>
  );
}

describe("useButtonInteraction", () => {
  registerActivatesACustomButtonOnceForADirectEnterKeyPress();

  registerPreventsScrollingOnSpaceKeydownAndActivatesOnceOnKeyup();

  registerPreservesAPendingSpaceActivationAcrossRerenders();

  registerCancelsAPendingSpaceActivationOnBlur();

  registerDoesNotActivateACustomButtonFromDescendantKeyboardEvents();

  registerDoesNotExposeNonInteractiveContainersAsButtons();
});

function registerActivatesACustomButtonOnceForADirectEnterKeyPress() {
  it("activates a custom button once for a direct Enter key press", () => {
    const onClick = vi.fn();
    render(<TestButton onClick={onClick} />);
    const button = screen.getByRole("button", { name: "Test Button" });

    fireEvent.keyDown(button, { key: "Enter" });
    fireEvent.keyDown(button, { key: "Enter", repeat: true });

    expect(onClick).toHaveBeenCalledOnce();
  });
}

function registerPreventsScrollingOnSpaceKeydownAndActivatesOnceOnKeyup() {
  it("prevents scrolling on Space keydown and activates once on keyup", () => {
    const onClick = vi.fn();
    render(<TestButton onClick={onClick} />);
    const button = screen.getByRole("button", { name: "Test Button" });

    expect(fireEvent.keyDown(button, { key: " " })).toBe(false);
    expect(fireEvent.keyDown(button, { key: " ", repeat: true })).toBe(false);
    expect(onClick).not.toHaveBeenCalled();
    fireEvent.keyUp(button, { key: " " });

    expect(onClick).toHaveBeenCalledOnce();
  });
}

function registerPreservesAPendingSpaceActivationAcrossRerenders() {
  it("preserves a pending Space activation across rerenders", () => {
    const onClick = vi.fn();
    const view = render(<TestButton onClick={onClick} />);

    fireEvent.keyDown(screen.getByRole("button", { name: "Test Button" }), { key: " " });
    view.rerender(<TestButton onClick={onClick} />);
    fireEvent.keyUp(screen.getByRole("button", { name: "Test Button" }), { key: " " });

    expect(onClick).toHaveBeenCalledOnce();
  });
}

function registerCancelsAPendingSpaceActivationOnBlur() {
  it("cancels a pending Space activation on blur", () => {
    const onClick = vi.fn();
    render(<TestButton onClick={onClick} />);
    const button = screen.getByRole("button", { name: "Test Button" });

    fireEvent.keyDown(button, { key: " " });
    fireEvent.blur(button);
    fireEvent.keyUp(button, { key: " " });

    expect(onClick).not.toHaveBeenCalled();
  });
}

function registerDoesNotActivateACustomButtonFromDescendantKeyboardEvents() {
  it("does not activate a custom button from descendant keyboard events", () => {
    const onClick = vi.fn();
    render(<NestedTestButton onClick={onClick} />);
    const input = screen.getByRole("textbox", { name: "Nested input" });

    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.keyDown(input, { key: " " });
    fireEvent.keyUp(input, { key: " " });

    expect(onClick).not.toHaveBeenCalled();
  });
}

function registerDoesNotExposeNonInteractiveContainersAsButtons() {
  it("does not expose non-interactive containers as buttons", () => {
    render(<TestButton />);

    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.getByText("Test Button")).not.toHaveAttribute("tabindex");
  });
}
