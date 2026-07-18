import cx from "classnames";
import type * as React from "react";
import { useSwipeable } from "react-swipeable";

import { CardActionsMenu } from "@/features/card/components/CardActionsMenu";
import { Score } from "@/shared/components";

export interface CardActionsProps {
  disabled?: boolean;
  onSwipedLeft?: (id: CardId) => void;
  onSwipedRight?: (id: CardId) => void;
  onDelete?: (id: CardId) => void;
  goToEdit?: (id: CardId) => void;
  goToView?: (id: CardId) => void;
}

export interface CardRowMenuProps {
  menuOpen?: boolean;
  onToggleMenu?: (id: CardId) => void;
  onCloseMenu?: () => void;
}

export type CardProps = CardActionsProps;

const studiedText = (count: number) => {
  if (count === 0) return "not studied yet";
  return `studied ${count} ${count === 1 ? "time" : "times"}`;
};

export const Card: React.FC<{ className?: string; card: Card } & CardActionsProps & CardRowMenuProps> = (props) => {
  const id = props.card.id;
  const disabled = Boolean(props.disabled);
  const withId = (action?: (id: CardId) => void) => () => {
    if (!disabled) action?.(id);
  };
  const handlers = useSwipeable({
    onSwipedLeft: withId(props.onSwipedLeft),
    onSwipedRight: withId(props.onSwipedRight),
    trackMouse: true,
  });
  const seenCount = props.card.numberOfSeen ?? 0;

  return (
    <article
      {...handlers}
      aria-busy={disabled}
      className={cx(
        "flex min-h-20 items-center gap-2 border-b border-border px-3 py-2 last:border-b-0 sm:gap-3 sm:px-4",
        disabled ? "bg-surface-muted" : "bg-surface",
        props.className
      )}
    >
      <Score className="shrink-0" score={props.card.score} />
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <button
          type="button"
          disabled={disabled}
          aria-label={`View ${props.card.frontText}`}
          className="flex min-h-touch w-full items-center rounded-control px-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed"
          onClick={withId(props.goToView)}
        >
          <span className="w-full truncate text-body font-semibold text-ink">{props.card.frontText}</span>
        </button>
        <div className="mt-1 flex w-full min-w-0 items-center gap-2 text-caption text-ink-muted">
          <span className="shrink-0">{studiedText(seenCount)}</span>
          {props.card.tags.length > 0 && (
            <fieldset
              aria-label={`Tags: ${props.card.tags.join(", ")}`}
              className="m-0 flex min-w-0 gap-1 overflow-hidden border-0 p-0"
            >
              {props.card.tags.map((tag) => (
                <span key={tag} className="shrink-0 rounded-pill bg-surface-muted px-2 py-0.5 text-xs text-ink">
                  {tag}
                </span>
              ))}
            </fieldset>
          )}
        </div>
      </div>
      <CardActionsMenu
        cardText={props.card.frontText}
        open={Boolean(props.menuOpen)}
        disabled={disabled}
        onToggle={withId(props.onToggleMenu)}
        onClose={() => props.onCloseMenu?.()}
        onEdit={withId(props.goToEdit)}
        onDelete={withId(props.onDelete)}
      />
    </article>
  );
};
