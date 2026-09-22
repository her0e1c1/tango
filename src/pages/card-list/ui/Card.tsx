/**
 * @file Defines the Card List Page's row presentation component.
 * The component renders props and reports user intent through callbacks while data access stays
 * outside the view.
 */

import cx from "classnames";
import type * as React from "react";
import { useTranslation } from "react-i18next";

import type { CardId } from "@/entities/card";
import { TagLabel } from "@/shared/ui/content";

import { CardActionsMenu } from "./CardActionsMenu";

interface CardItem {
  id: CardId;
  frontText: string;
  tags: string[];
}

export interface CardActionsProps {
  disabled?: boolean;
  onDelete?: (id: CardId) => void;
  goToEdit?: (id: CardId) => void;
  goToView?: (id: CardId) => void;
}

interface CardRowMenuProps {
  menuOpen?: boolean;
  onToggleMenu?: (id: CardId) => void;
  onCloseMenu?: () => void;
}

export interface CardProps extends CardActionsProps, CardRowMenuProps {
  className?: string;
  card: CardItem;
}

export const Card: React.FC<CardProps> = (props) => {
  const { t } = useTranslation();
  const { id } = props.card;
  const disabled = Boolean(props.disabled);
  /**
   * Wraps an optional action so it receives the current item's identifier when invoked.
   * Presentation markup can pass a parameterless callback while domain actions still receive the
   * item they should change.
   */
  const withId = (action?: (id: CardId) => void) => () => {
    if (!disabled) action?.(id);
  };
  return (
    <article
      aria-busy={disabled}
      className={cx(
        "flex min-h-20 items-center gap-2 border-b border-border px-3 py-2 transition-colors duration-fast ease-calm last:border-b-0 sm:gap-3 sm:px-4 dark:border-black",
        disabled ? "bg-surface-muted" : "bg-surface",
        !disabled && "hover:bg-surface-muted",
        props.className
      )}
    >
      <div className="relative flex min-h-touch min-w-0 flex-1 flex-col justify-center rounded-control">
        <button
          type="button"
          disabled={disabled}
          aria-label={t("cardList.card.view", { cardText: props.card.frontText })}
          className="absolute inset-0 z-10 rounded-control text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed"
          onClick={() => {
            if (!disabled) props.goToView?.(id);
          }}
        />
        <span className="w-full truncate px-1 text-body font-semibold text-ink">{props.card.frontText}</span>
        <div className="mt-1 flex w-full min-w-0 items-center gap-2 text-caption text-ink-muted">
          {props.card.tags.length > 0 && (
            <fieldset
              aria-label={t("cardList.card.tags", { tags: props.card.tags.join(", ") })}
              className="m-0 flex min-w-0 max-w-full gap-1 overflow-hidden border-0 p-0"
            >
              {props.card.tags.map((tag) => (
                <TagLabel className="shrink-0" key={tag} label={tag} />
              ))}
            </fieldset>
          )}
        </div>
      </div>
      <div className="shrink-0">
        <CardActionsMenu
          cardText={props.card.frontText}
          open={Boolean(props.menuOpen)}
          disabled={disabled}
          onToggle={withId(props.onToggleMenu)}
          onClose={() => props.onCloseMenu?.()}
          onEdit={withId(props.goToEdit)}
          onDelete={withId(props.onDelete)}
        />
      </div>
    </article>
  );
};
