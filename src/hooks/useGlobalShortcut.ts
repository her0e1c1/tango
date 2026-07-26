/**
 * @file Provides keyboard shortcuts that do not interfere with focused controls or text entry.
 */

import { useKey } from "react-use";

const INTERACTIVE_SHORTCUT_TARGET = [
  "a[href]",
  "button",
  "input",
  "select",
  "textarea",
  '[contenteditable="true"]',
  '[role="button"]',
  '[role="combobox"]',
  '[role="listbox"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[role="slider"]',
  '[role="switch"]',
  '[role="textbox"]',
].join(",");

/**
 * Returns true when a keyboard event originated from a control whose native interaction must win
 * over an application-wide shortcut.
 */
export const hasInteractiveShortcutTarget = (target: EventTarget | null): boolean =>
  target instanceof Element && target.closest(INTERACTIVE_SHORTCUT_TARGET) != null;

/**
 * Registers one document-level shortcut while leaving form fields, links, buttons, sliders, menus,
 * and editable content to their native keyboard behavior.
 */
export const useGlobalShortcut = (key: string, handler: (event: KeyboardEvent) => void, enabled = true): void => {
  useKey(
    (event) => enabled && event.key === key && !hasInteractiveShortcutTarget(event.target),
    handler,
    {},
    [enabled, handler, key]
  );
};
