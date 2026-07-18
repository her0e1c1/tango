import cx from "classnames";
import * as React from "react";
import { useSwipeable } from "react-swipeable";

import { CardActionsMenu } from "@/features/card/components/CardActionsMenu";
import { Score, TagLabel } from "@/components";

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
  const suppressViewClick = React.useRef(false);
  const suppressViewClickTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const menuBoundary = React.useRef<HTMLDivElement>(null);

  React.useEffect(
    () => () => {
      if (suppressViewClickTimer.current !== undefined) clearTimeout(suppressViewClickTimer.current);
    },
    []
  );

  React.useEffect(() => {
    const boundary = menuBoundary.current;
    if (boundary == null) return;

    const stopSwipeTracking = (event: Event) => event.stopPropagation();
    const boundaryEvents = ["mousedown", "touchstart", "touchmove", "touchend", "touchcancel"] as const;
    for (const eventName of boundaryEvents) boundary.addEventListener(eventName, stopSwipeTracking);

    return () => {
      for (const eventName of boundaryEvents) boundary.removeEventListener(eventName, stopSwipeTracking);
    };
  }, []);

  const withId = (action?: (id: CardId) => void) => () => {
    if (!disabled) action?.(id);
  };
  const withSwipeId = (action?: (id: CardId) => void) => () => {
    if (disabled) return;

    suppressViewClick.current = true;
    if (suppressViewClickTimer.current !== undefined) clearTimeout(suppressViewClickTimer.current);
    suppressViewClickTimer.current = setTimeout(() => {
      suppressViewClick.current = false;
      suppressViewClickTimer.current = undefined;
    }, 0);
    action?.(id);
  };
  const handlers = useSwipeable({
    onSwipedLeft: withSwipeId(props.onSwipedLeft),
    onSwipedRight: withSwipeId(props.onSwipedRight),
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
      <div className="relative flex min-h-touch min-w-0 flex-1 flex-col justify-center rounded-control">
        <button
          type="button"
          disabled={disabled}
          aria-label={`View ${props.card.frontText}`}
          className="absolute inset-0 z-10 rounded-control text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed"
          onClick={() => {
            if (!disabled && !suppressViewClick.current) props.goToView?.(id);
          }}
        />
        <span className="w-full truncate px-1 text-body font-semibold text-ink">{props.card.frontText}</span>
        <div className="mt-1 flex w-full min-w-0 items-center gap-2 text-caption text-ink-muted">
          <span className="shrink-0">{studiedText(seenCount)}</span>
          {props.card.tags.length > 0 && (
            <fieldset
              aria-label={`Tags: ${props.card.tags.join(", ")}`}
              className="m-0 flex min-w-0 max-w-full gap-1 overflow-hidden border-0 p-0"
            >
              {props.card.tags.map((tag) => (
                <TagLabel className="shrink-0" key={tag} label={tag} />
              ))}
            </fieldset>
          )}
        </div>
      </div>
      <div ref={menuBoundary} className="shrink-0">
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
