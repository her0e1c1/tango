import { describe, expect, it } from "vitest";

import { isInteractiveShortcutTarget } from "./isInteractiveShortcutTarget";

describe("isInteractiveShortcutTarget", () => {
  it.each([document, window, document.createElement("div")])("rejects a non-interactive target", (target) => {
    expect(isInteractiveShortcutTarget(target)).toBe(false);
  });

  it.each([
    ["link", "a", '<a href="/settings">Settings</a>'],
    ["button", "button", "<button>Save</button>"],
    ["input", "input", "<input>"],
    ["select", "select", "<select></select>"],
    ["summary", "summary", "<details><summary>Advanced</summary></details>"],
    ["textarea", "textarea", "<textarea></textarea>"],
  ])("accepts a %s", (_name, selector, html) => {
    const container = document.createElement("div");
    container.innerHTML = html;

    expect(isInteractiveShortcutTarget(container.querySelector(selector))).toBe(true);
  });

  it("accepts a descendant of an interactive element", () => {
    const button = document.createElement("button");
    const icon = document.createElement("span");
    button.append(icon);

    expect(isInteractiveShortcutTarget(icon)).toBe(true);
  });

  it.each(["", "true", "plaintext-only"])("accepts contenteditable=%s", (value) => {
    const editable = document.createElement("div");
    editable.setAttribute("contenteditable", value);

    expect(isInteractiveShortcutTarget(editable)).toBe(true);
  });

  it('rejects contenteditable="false"', () => {
    const element = document.createElement("div");
    element.setAttribute("contenteditable", "false");

    expect(isInteractiveShortcutTarget(element)).toBe(false);
  });
});
