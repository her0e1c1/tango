/** @file Verifies that global shortcuts defer to focused interactive controls. */

import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { hasInteractiveShortcutTarget, useGlobalShortcut } from "@/hooks/useGlobalShortcut";

const ShortcutHarness = ({ onShortcut }: { onShortcut: () => void }) => {
  useGlobalShortcut("t", onShortcut);
  return (
    <div>
      <input aria-label="text input" />
      <button type="button">Button</button>
      <input aria-label="slider" type="range" />
      <div role="button" tabIndex={0}>
        Custom button
      </div>
      <div data-testid="page" tabIndex={-1}>
        Page
      </div>
    </div>
  );
};

afterEach(cleanup);

describe("useGlobalShortcut", () => {
  it("ignores native and ARIA interactive targets", () => {
    const onShortcut = vi.fn();
    const view = render(<ShortcutHarness onShortcut={onShortcut} />);

    fireEvent.keyDown(view.getByLabelText("text input"), { key: "t" });
    fireEvent.keyDown(view.getByRole("button", { name: "Button" }), { key: "t" });
    fireEvent.keyDown(view.getByLabelText("slider"), { key: "t" });
    fireEvent.keyDown(view.getByRole("button", { name: "Custom button" }), { key: "t" });

    expect(onShortcut).not.toHaveBeenCalled();
  });

  it("runs outside interactive controls", () => {
    const onShortcut = vi.fn();
    const view = render(<ShortcutHarness onShortcut={onShortcut} />);

    fireEvent.keyDown(view.getByTestId("page"), { key: "t" });

    expect(onShortcut).toHaveBeenCalledOnce();
  });
});

describe("hasInteractiveShortcutTarget", () => {
  it("recognizes contenteditable descendants", () => {
    const editable = document.createElement("div");
    editable.contentEditable = "true";
    const child = document.createElement("span");
    editable.append(child);

    expect(hasInteractiveShortcutTarget(child)).toBe(true);
  });
});
