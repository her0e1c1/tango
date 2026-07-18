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

const focusAdjacentToTrigger = (menu: HTMLElement, direction: -1 | 1) => {
  const trigger = menu.parentElement?.querySelector<HTMLButtonElement>('[aria-haspopup="menu"]');
  if (trigger == null) return;

  const focusable = Array.from(document.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) => element.tabIndex >= 0 && element.closest("[hidden], [inert]") == null
  );
  const triggerIndex = focusable.indexOf(trigger);
  focusable[triggerIndex + direction]?.focus();
};

export const ActionsMenu: React.FC<ActionsMenuProps> = (props) => {
  const focusTrigger = (menu: HTMLElement) => {
    const trigger = menu.parentElement?.querySelector<HTMLButtonElement>('[aria-haspopup="menu"]');
    trigger?.focus();
  };

  const run = (action?: () => void) => (event: React.MouseEvent<HTMLButtonElement>) => {
    const menu = event.currentTarget.parentElement;
    action?.();
    props.onClose();
    if (menu != null) focusTrigger(menu);
  };

  const handleToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    const root = event.currentTarget.parentElement;
    props.onToggle();
    if (!props.open) queueMicrotask(() => root?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus());
  };

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

  const handleBlur = (event: React.FocusEvent<HTMLFieldSetElement>) => {
    const root = event.currentTarget;
    if (event.relatedTarget instanceof Node && root.contains(event.relatedTarget)) return;

    queueMicrotask(() => {
      if (!root.contains(document.activeElement)) props.onClose();
    });
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
