import { describe, expect, it } from "vitest";

import { isInteractiveShortcutTarget } from "./isInteractiveShortcutTarget";

describe("isInteractiveShortcutTarget", () => {
  it.each(["a", "button", "input", "select", "textarea"])("recognizes %s controls", (tagName) => {
    const element = document.createElement(tagName);
    if (element instanceof HTMLAnchorElement) element.href = "/";
    expect(isInteractiveShortcutTarget(element)).toBe(true);
  });

  it("recognizes editable content and descendants of controls", () => {
    const editable = document.createElement("div");
    editable.setAttribute("contenteditable", "true");
    const child = document.createElement("span");
    editable.append(child);
    expect(isInteractiveShortcutTarget(child)).toBe(true);
  });

  it("allows ordinary page targets", () => {
    expect(isInteractiveShortcutTarget(document.createElement("div"))).toBe(false);
    expect(isInteractiveShortcutTarget(window)).toBe(false);
  });
});
