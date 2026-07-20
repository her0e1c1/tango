/**
 * @file Defines the reusable Actions Menu component in the shared form library.
 * Feature screens compose this building block through props instead of duplicating presentation
 * and interaction rules.
 */

import type * as React from "react";
import { AiOutlineMore } from "react-icons/ai";

export interface ActionsMenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
  onSelect?: () => void;
}

export interface ActionsMenuProps {
  groupLabel: string;
  triggerLabel: string;
  menuLabel: string;
  open: boolean;
  disabled?: boolean;
  onToggle: () => void;
  onClose: () => void;
  items: ActionsMenuItem[];
}

const itemClassName =
  "flex min-h-touch w-full items-center gap-2 px-3 py-2 text-left text-body text-ink hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none";

const triggerClassName =
  "inline-flex size-touch items-center justify-center rounded-control text-ink-muted hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50";

const menuClassName =
  "absolute right-0 top-full z-20 min-w-40 rounded-control border border-border bg-surface py-1 shadow-elevated";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * Moves keyboard focus to the menu item next to the trigger button.
 * This preserves an intuitive focus position when an actions menu opens from either direction.
 */
const focusAdjacentToTrigger = (menu: HTMLElement, direction: -1 | 1) => {
  const trigger = menu.parentElement?.querySelector<HTMLButtonElement>('[aria-haspopup="menu"]');
  if (trigger == null) return;

  const focusable = Array.from(document.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) => element.tabIndex >= 0 && element.closest("[hidden], [inert]") == null
  );
  const triggerIndex = focusable.indexOf(trigger);
  focusable[triggerIndex + direction]?.focus();
};

/**
 * Renders the Actions Menu user interface.
 * Displays available actions in an accessible menu, manages keyboard focus, and reports selection
 * or dismissal to its owner.
 */
export const ActionsMenu: React.FC<ActionsMenuProps> = (props) => {
  /**
   * Returns keyboard focus to the button that opened this actions menu.
   * Closing an item or tabbing away therefore leaves focus at a predictable control.
   */
  const focusTrigger = (menu: HTMLElement) => {
    const trigger = menu.parentElement?.querySelector<HTMLButtonElement>('[aria-haspopup="menu"]');
    trigger?.focus();
  };

  /**
   * Wraps a menu action so selecting it also closes the menu and restores trigger focus.
   * Items can omit their action while still receiving the same predictable menu cleanup.
   */
  const run = (action?: () => void) => (event: React.MouseEvent<HTMLButtonElement>) => {
    const menu = event.currentTarget.parentElement;
    action?.();
    props.onClose();
    if (menu != null) focusTrigger(menu);
  };

  /**
   * Handles the toggle callback for the application.
   * The handler translates the event or asynchronous result into the next state change or
   * operation.
   */
  const handleToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    const root = event.currentTarget.parentElement;
    props.onToggle();
    if (!props.open) queueMicrotask(() => root?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus());
  };

  /**
   * Handles the menu key down callback for the application.
   * The handler translates the event or asynchronous result into the next state change or
   * operation.
   */
  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      props.onClose();
      focusTrigger(event.currentTarget);
      return;
    }
    if (event.key === "Tab") {
      event.preventDefault();
      const menu = event.currentTarget;
      props.onClose();
      focusAdjacentToTrigger(menu, event.shiftKey ? -1 : 1);
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;

    event.preventDefault();
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'));
    const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? items.length - 1
          : event.key === "ArrowDown"
            ? (currentIndex + 1) % items.length
            : (currentIndex - 1 + items.length) % items.length;
    items[nextIndex]?.focus();
  };

  /**
   * Handles the blur callback for the application.
   * The handler translates the event or asynchronous result into the next state change or
   * operation.
   */
  const handleBlur = (event: React.FocusEvent<HTMLFieldSetElement>) => {
    const root = event.currentTarget;
    if (event.relatedTarget instanceof Node && root.contains(event.relatedTarget)) return;
    const menu = root.querySelector<HTMLElement>('[role="menu"]');

    setTimeout(() => {
      if (root.isConnected && menu?.isConnected && root.contains(menu) && !root.contains(document.activeElement)) {
        props.onClose();
      }
    }, 0);
  };

  const isOpen = props.open && !props.disabled;

  return (
    <fieldset aria-label={props.groupLabel} className="relative min-w-0 shrink-0 border-0 p-0" onBlur={handleBlur}>
      <button
        type="button"
        className={triggerClassName}
        aria-label={props.triggerLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        disabled={props.disabled}
        onClick={handleToggle}
      >
        <AiOutlineMore aria-hidden="true" size={24} />
      </button>

      {isOpen && (
        <div role="menu" aria-label={props.menuLabel} className={menuClassName} onKeyDown={handleMenuKeyDown}>
          {props.items.map((item) => (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              tabIndex={-1}
              className={item.danger ? `${itemClassName} text-danger` : itemClassName}
              onClick={run(item.onSelect)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </fieldset>
  );
};
