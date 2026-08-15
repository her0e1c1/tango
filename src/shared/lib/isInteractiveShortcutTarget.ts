const interactiveShortcutTargetSelector = [
  "a[href]",
  "button",
  "input",
  "select",
  "summary",
  "textarea",
  '[contenteditable]:not([contenteditable="false"])',
].join(",");

export const isInteractiveShortcutTarget = (target: EventTarget | null): boolean =>
  target instanceof Element && target.closest(interactiveShortcutTargetSelector) != null;
