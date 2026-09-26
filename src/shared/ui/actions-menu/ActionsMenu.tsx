/**
 * @file Defines the reusable Actions Menu component.
 * Feature screens compose this building block through props instead of duplicating presentation
 * and interaction rules.
 */

import type * as React from "react";
import { useTranslation } from "react-i18next";
import { AiOutlineMore } from "react-icons/ai";

import { focusableElementSelector } from "../../lib/focusableElementSelector";

export interface ActionsMenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
  onSelect?: () => void;
}

export interface ActionsMenuProps {
  mobileSheet?: boolean;
  groupLabel: string;
  triggerLabel: string;
  triggerContent?: React.ReactNode;
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

const mobileSheetClassName =
  "fixed inset-x-0 bottom-0 z-[70] max-h-[calc(100dvh-env(safe-area-inset-top)-1rem)] overflow-y-auto overscroll-contain rounded-t-surface border border-border bg-surface px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-elevated sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-full sm:z-20 sm:max-h-[70dvh] sm:min-w-40 sm:rounded-control sm:px-0 sm:py-1";

const isVisible = (element: HTMLElement) => {
  for (let parent: HTMLElement | null = element; parent != null; parent = parent.parentElement) {
    const style = getComputedStyle(parent);
    if (parent.hidden || parent.inert || style.display === "none" || style.visibility === "hidden") return false;
  }
  return true;
};

/**
 * Moves keyboard focus to the menu item next to the trigger button.
 * This preserves an intuitive focus position when an actions menu opens from either direction.
 */
const focusAdjacentToTrigger = (menu: HTMLElement, direction: -1 | 1) => {
  const trigger = menu.parentElement?.querySelector<HTMLButtonElement>('[aria-haspopup="menu"]');
  if (trigger == null) return;

  const focusable = Array.from(document.querySelectorAll<HTMLElement>(focusableElementSelector)).filter(
    (element) => element.tabIndex >= 0 && element.closest("[hidden], [inert]") == null && isVisible(element)
  );
  const triggerIndex = focusable.indexOf(trigger);
  focusable[triggerIndex + direction]?.focus();
};

const handleNavigationKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;

  event.preventDefault();
  const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')).filter(
    isVisible
  );
  const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
  let nextIndex = 0;
  if (event.key === "End") {
    nextIndex = items.length - 1;
  } else if (event.key === "ArrowDown") {
    nextIndex = (currentIndex + 1) % items.length;
  } else if (event.key === "ArrowUp") {
    nextIndex = (currentIndex - 1 + items.length) % items.length;
  }
  items[nextIndex]?.focus();
};

/**
 * Renders the Actions Menu user interface.
 * Displays available actions in an accessible menu, manages keyboard focus, and reports selection
 * or dismissal to its owner.
 */
export const ActionsMenu: React.FC<ActionsMenuProps> = (props) => {
  const { t } = useTranslation();
  const handleToggle = (event: React.MouseEvent<HTMLButtonElement>) => toggleMenu(event, props.onToggle, props.open);
  const handleBlur = (event: React.FocusEvent<HTMLFieldSetElement>) => closeOnBlur(event, props.onClose);

  const isOpen = props.open && !props.disabled;

  return (
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: The fieldset observes focus leaving its composite menu.
    <fieldset aria-label={props.groupLabel} className="relative min-w-0 shrink-0 border-0 p-0" onBlur={handleBlur}>
      <button
        type="button"
        className={
          props.triggerContent == null
            ? triggerClassName
            : `${triggerClassName} w-auto gap-2 border border-border px-3 font-semibold`
        }
        aria-label={props.triggerLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        disabled={props.disabled}
        onClick={handleToggle}
      >
        {props.triggerContent ?? <AiOutlineMore aria-hidden="true" size={24} />}
      </button>

      {isOpen && props.mobileSheet === true && (
        <button
          type="button"
          tabIndex={-1}
          aria-label={t("actionsMenu.close")}
          className="fixed inset-0 z-[60] bg-canvas/70 sm:hidden"
          onClick={(event) => {
            props.onClose();
            event.currentTarget.parentElement?.querySelector<HTMLButtonElement>('[aria-haspopup="menu"]')?.focus();
          }}
        />
      )}
      {isOpen ? (
        <MenuOptions
          items={props.items}
          mobileSheet={props.mobileSheet}
          menuLabel={props.menuLabel}
          onClose={props.onClose}
        />
      ) : null}
    </fieldset>
  );
};

const focusTrigger = (menu: HTMLElement) => {
  const trigger = menu.parentElement?.querySelector<HTMLButtonElement>('[aria-haspopup="menu"]');
  trigger?.focus();
};

function runMenuAction(event: React.MouseEvent<HTMLButtonElement>, onClose: () => void, action?: () => void) {
  const menu = event.currentTarget.closest<HTMLElement>('[role="menu"]');
  action?.();
  onClose();
  if (menu != null) focusTrigger(menu);
}

function toggleMenu(event: React.MouseEvent<HTMLButtonElement>, onToggle: () => void, open: boolean) {
  const root = event.currentTarget.parentElement;
  onToggle();
  if (!open) queueMicrotask(() => root?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus());
}

function handleMenuKey(event: React.KeyboardEvent<HTMLDivElement>, onClose: () => void) {
  if (event.key === "Escape") {
    event.preventDefault();
    onClose();
    focusTrigger(event.currentTarget);
    return;
  }
  if (event.key === "Tab") {
    event.preventDefault();
    const menu = event.currentTarget;
    onClose();
    focusAdjacentToTrigger(menu, event.shiftKey ? -1 : 1);
    return;
  }
  handleNavigationKey(event);
}

function closeOnBlur(event: React.FocusEvent<HTMLFieldSetElement>, onClose: () => void) {
  const root = event.currentTarget;
  if (event.relatedTarget instanceof Node && root.contains(event.relatedTarget)) return;
  const menu = root.querySelector<HTMLElement>('[role="menu"]');

  // Defer closing until a pending click can run; closing during blur would unmount its menu item first.
  setTimeout(() => {
    if (root.isConnected && menu?.isConnected && root.contains(menu) && !root.contains(document.activeElement)) {
      onClose();
    }
  }, 0);
}

function MenuOptions(props: {
  items: ActionsMenuItem[];
  mobileSheet: boolean | undefined;
  menuLabel: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const run = (action?: () => void) => (event: React.MouseEvent<HTMLButtonElement>) =>
    runMenuAction(event, props.onClose, action);
  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => handleMenuKey(event, props.onClose);
  return (
    <div
      role="menu"
      aria-label={props.menuLabel}
      className={props.mobileSheet ? mobileSheetClassName : menuClassName}
      onKeyDown={handleMenuKeyDown}
    >
      {props.mobileSheet === true && (
        <div role="presentation" className="px-3 py-3 text-caption font-semibold break-words text-ink-muted sm:hidden">
          {props.menuLabel}
        </div>
      )}
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
      {props.mobileSheet === true && (
        <button
          type="button"
          role="menuitem"
          tabIndex={-1}
          className={`${itemClassName} mt-2 border-t border-border sm:hidden`}
          onClick={run()}
        >
          {t("actionsMenu.close")}
        </button>
      )}
    </div>
  );
}
