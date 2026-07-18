import type * as React from "react";
import { AiOutlineCloudDownload, AiOutlineDelete, AiOutlineEdit, AiOutlineMore, AiOutlineReload } from "react-icons/ai";

export interface DeckActionsMenuProps {
  deckName: string;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onRestart?: () => void;
  onDownload?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const itemClassName =
  "flex min-h-touch w-full items-center gap-2 px-3 py-2 text-left text-body text-ink hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none";

export const DeckActionsMenu: React.FC<DeckActionsMenuProps> = (props) => {
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

  return (
    <fieldset
      aria-label={`Deck actions for ${props.deckName}`}
      className="relative min-w-0 shrink-0 border-0 p-0"
      onBlur={handleBlur}
    >
      <button
        type="button"
        className="inline-flex size-touch items-center justify-center rounded-control text-ink-muted hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        aria-label={`Open actions for ${props.deckName}`}
        aria-haspopup="menu"
        aria-expanded={props.open}
        onClick={handleToggle}
      >
        <AiOutlineMore aria-hidden="true" size={24} />
      </button>

      {props.open && (
        <div
          role="menu"
          aria-label={`Actions for ${props.deckName}`}
          className="absolute right-0 top-full z-20 min-w-40 rounded-control border border-border bg-surface py-1 shadow-elevated"
          onKeyDown={handleMenuKeyDown}
        >
          {props.onRestart != null && (
            <button type="button" role="menuitem" className={itemClassName} onClick={run(props.onRestart)}>
              <AiOutlineReload aria-hidden="true" />
              Restart
            </button>
          )}
          <button type="button" role="menuitem" className={itemClassName} onClick={run(props.onDownload)}>
            <AiOutlineCloudDownload aria-hidden="true" />
            Download
          </button>
          <button type="button" role="menuitem" className={itemClassName} onClick={run(props.onEdit)}>
            <AiOutlineEdit aria-hidden="true" />
            Edit
          </button>
          <button
            type="button"
            role="menuitem"
            className={`${itemClassName} text-danger`}
            onClick={run(props.onDelete)}
          >
            <AiOutlineDelete aria-hidden="true" />
            Delete
          </button>
        </div>
      )}
    </fieldset>
  );
};
