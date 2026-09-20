import cx from "classnames";
import * as React from "react";
import { AiOutlineLeft, AiOutlineRight, AiOutlineSwap } from "react-icons/ai";
import { useTranslation } from "react-i18next";
import { useSwipeable } from "react-swipeable";

import { useButtonInteraction } from "@/shared/ui/button-interaction";

export interface DeckViewProps {
  deckName: string;
  current: number;
  total: number;
  showBackText: boolean;
  onBack: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onFlip: () => void;
  front: React.ReactNode;
  back: React.ReactNode;
}

const controlClass =
  "inline-flex min-h-touch min-w-touch items-center justify-center gap-2 rounded-control px-3 py-2 text-ink-muted transition-colors duration-fast ease-calm hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus";

interface CardSurfaceProps {
  current: number;
  showBackText: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onFlip: () => void;
  front: React.ReactNode;
  back: React.ReactNode;
}

const CardSurface: React.FC<CardSurfaceProps> = (props) => {
  const { t } = useTranslation();
  const { current: cardPosition } = props;
  const contentId = React.useId();
  const surfaceRef = React.useRef<HTMLDivElement | null>(null);
  const suppressCardClick = React.useRef(false);
  const suppressCardClickTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const frontInteraction = useButtonInteraction<HTMLDivElement>(props.onFlip);

  React.useEffect(() => {
    if (surfaceRef.current !== null) surfaceRef.current.scrollTop = 0;
  }, [cardPosition, props.showBackText]);

  React.useEffect(
    () => () => {
      if (suppressCardClickTimer.current !== undefined) clearTimeout(suppressCardClickTimer.current);
    },
    []
  );

  const swipeHandlers = useSwipeable({
    onSwiped: () => {
      // A drag can emit a click after navigation; it must not flip the newly displayed card.
      suppressCardClick.current = true;
      if (suppressCardClickTimer.current !== undefined) clearTimeout(suppressCardClickTimer.current);
      suppressCardClickTimer.current = setTimeout(() => {
        suppressCardClick.current = false;
        suppressCardClickTimer.current = undefined;
      }, 0);
    },
    onSwipedLeft: props.onPrevious,
    onSwipedRight: props.onNext,
    trackMouse: true,
  });

  const stopTrailingCardClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    // biome-ignore lint/suspicious/noUnnecessaryConditions: React refs are mutable; remove after biomejs/biome#11174.
    if (!suppressCardClick.current) return;

    suppressCardClick.current = false;
    if (suppressCardClickTimer.current !== undefined) clearTimeout(suppressCardClickTimer.current);
    suppressCardClickTimer.current = undefined;
    event.preventDefault();
    event.stopPropagation();
  };

  const flipFromCard: React.MouseEventHandler<HTMLDivElement> = (event) => {
    if (event.button !== 0) return;
    // Rich card content can contain links; activating them must keep their own behavior.
    if (event.target instanceof Element && event.target.closest("a, button, input, select, textarea")) return;
    props.onFlip();
  };

  const flipFromAnswerKey: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.target !== event.currentTarget || event.key !== "Enter" || event.repeat) return;
    event.preventDefault();
    props.onFlip();
  };

  const surfaceInteraction = props.showBackText
    ? { role: "region", tabIndex: 0, onKeyDown: flipFromAnswerKey, "aria-label": t("deckView.answerAria") }
    : { ...frontInteraction, "aria-label": t("deckView.frontAria"), "aria-describedby": contentId };
  const cardGestureHandlers = {
    ...swipeHandlers,
    onClick: flipFromCard,
    onClickCapture: stopTrailingCardClick,
    onMouseDown: (event: React.MouseEvent<HTMLDivElement>) => {
      // react-swipeable accepts every mouse button unless the primary button is checked here.
      if (event.button === 0) swipeHandlers.onMouseDown?.(event);
    },
  };

  return (
    <div
      {...surfaceInteraction}
      {...cardGestureHandlers}
      ref={(element) => {
        surfaceRef.current = element;
        swipeHandlers.ref(element);
      }}
      className={cx(
        "relative min-h-0 flex-1 touch-pan-y overscroll-contain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus",
        props.showBackText ? "overflow-y-auto" : "overflow-hidden"
      )}
    >
      <div id={contentId} className={props.showBackText ? "min-h-full" : "h-full"}>
        {props.showBackText ? props.back : props.front}
      </div>
    </div>
  );
};

export const DeckView: React.FC<DeckViewProps> = (props) => {
  const { t } = useTranslation();

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-canvas text-ink">
      <header className="flex shrink-0 items-center gap-3 pb-3 pl-[calc(var(--spacing-shell-gutter)+env(safe-area-inset-left))] pr-[calc(var(--spacing-shell-gutter)+env(safe-area-inset-right))] pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <button type="button" aria-label={t("deckView.back")} className={controlClass} onClick={props.onBack}>
          <AiOutlineLeft aria-hidden="true" className="text-xl" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-caption text-ink-muted">{t("deckView.title")}</p>
          <h1 className="truncate text-body font-semibold" title={props.deckName}>
            {props.deckName}
          </h1>
        </div>
        <output aria-label={t("deckView.progress")} className="shrink-0 text-caption tabular-nums text-ink-muted">
          {t("deckView.position", { current: props.current, total: props.total })}
        </output>
      </header>
      {props.total === 0 ? (
        <div className="flex min-h-0 flex-1 items-center justify-center px-shell-gutter pb-section-gap text-center">
          <p className="text-body text-ink-muted">{t("deckView.empty")}</p>
        </div>
      ) : (
        <>
          <CardSurface
            current={props.current}
            showBackText={props.showBackText}
            onPrevious={props.onPrevious}
            onNext={props.onNext}
            onFlip={props.onFlip}
            front={props.front}
            back={props.back}
          />
          <div className="shrink-0 border-t border-border pb-[calc(0.75rem+env(safe-area-inset-bottom))] pl-[calc(var(--spacing-shell-gutter)+env(safe-area-inset-left))] pr-[calc(var(--spacing-shell-gutter)+env(safe-area-inset-right))] pt-3">
            <div className="mx-auto flex w-full max-w-content items-center justify-between gap-2">
              <button
                type="button"
                aria-label={t("deckView.previous")}
                className={controlClass}
                onClick={props.onPrevious}
              >
                <AiOutlineLeft aria-hidden="true" className="text-xl" />
                <span className="hidden text-caption sm:inline">{t("deckView.previous")}</span>
              </button>
              <button type="button" aria-label={t("deckView.flip")} className={controlClass} onClick={props.onFlip}>
                <AiOutlineSwap aria-hidden="true" className="text-xl" />
                <span className="text-caption">{t("deckView.flip")}</span>
              </button>
              <button type="button" aria-label={t("deckView.next")} className={controlClass} onClick={props.onNext}>
                <span className="hidden text-caption sm:inline">{t("deckView.next")}</span>
                <AiOutlineRight aria-hidden="true" className="text-xl" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
