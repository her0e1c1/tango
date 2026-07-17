import * as React from "react";
import { AiFillCaretRight, AiOutlineCloud } from "react-icons/ai";

import { DeckActionsMenu } from "@/features/deck/components/DeckActionsMenu";

export interface DeckListStudyProgress {
  currentIndex: number;
  cardCount: number;
  lastStudiedAt: number;
}

export interface DeckCardActions {
  onClickName?: (id: DeckId) => void;
  onClickContinue?: (id: DeckId) => void;
  onClickStudy?: (id: DeckId) => void;
  onClickRestart?: (id: DeckId) => void;
  onClickDownload?: (id: DeckId) => void;
  onClickEdit?: (id: DeckId) => void;
  onClickDelete?: (id: DeckId) => void;
  openMenuDeckId?: DeckId | undefined;
  onToggleMenu?: (id: DeckId) => void;
  onCloseMenu?: () => void;
}

export interface DeckCardProps extends DeckCardActions {
  deck: Deck;
  cardCount: number;
  studyProgress?: DeckListStudyProgress;
}

const formatLastStudied = (timestamp: number): string => {
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (elapsedSeconds < 60) return "just now";
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}h ago`;
  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 30) return `${elapsedDays}d ago`;
  const elapsedMonths = Math.floor(elapsedDays / 30);
  if (elapsedMonths < 12) return `${elapsedMonths}mo ago`;
  return `${Math.floor(elapsedMonths / 12)}y ago`;
};

const primaryActionClassName =
  "inline-flex min-h-touch shrink-0 items-center justify-center gap-1 rounded-control px-3 text-caption font-semibold transition-colors duration-fast ease-calm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus";

export const DeckCard: React.FC<DeckCardProps> = (props) => {
  const { deck, studyProgress } = props;
  const active = studyProgress != null;
  const progressValue = active ? studyProgress.currentIndex + 1 : 0;
  const progressPercent = active ? Math.min(100, (progressValue / studyProgress.cardCount) * 100) : 0;
  const withId = (action?: (id: DeckId) => void) => () => action?.(deck.id);
  const statusId = React.useId();

  return (
    <article className="relative flex min-h-20 items-center gap-2 border-b border-border px-3 py-2 last:border-b-0">
      <div className="min-w-0 flex-1 px-1 py-1">
        <button
          type="button"
          aria-label={`View ${deck.name}`}
          aria-describedby={statusId}
          className="flex w-full min-w-0 items-center gap-1.5 rounded-control text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          onClick={withId(props.onClickName)}
        >
          <span className="truncate text-body font-semibold text-ink">{deck.name}</span>
          {deck.isPublic && (
            <span role="img" aria-label="Public deck" className="shrink-0 text-ink-muted">
              <AiOutlineCloud aria-hidden="true" size={16} />
            </span>
          )}
        </button>

        <span id={statusId} className="mt-1 flex min-w-0 items-center gap-2 text-caption text-ink-muted">
          {deck.category !== "" && (
            <span className="max-w-28 truncate rounded-pill bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink">
              {deck.category}
            </span>
          )}
          <span className="truncate">
            {active
              ? `${progressValue} / ${studyProgress.cardCount} · ${formatLastStudied(studyProgress.lastStudiedAt)}`
              : `${props.cardCount} ${props.cardCount === 1 ? "card" : "cards"}`}
          </span>
        </span>

        {active && (
          <span
            role="progressbar"
            aria-label={`Progress for ${deck.name}`}
            aria-valuemin={0}
            aria-valuemax={studyProgress.cardCount}
            aria-valuenow={progressValue}
            className="mt-2 block h-1 overflow-hidden rounded-pill bg-surface-muted"
          >
            <span className="block h-full rounded-pill bg-accent-primary" style={{ width: `${progressPercent}%` }} />
          </span>
        )}
      </div>

      <button
        type="button"
        aria-label={`${active ? "Continue" : "Study"} ${deck.name}`}
        className={`${primaryActionClassName} ${
          active
            ? "bg-accent-primary text-ink-inverse hover:opacity-90"
            : "border border-border bg-transparent text-ink hover:bg-surface-muted"
        }`}
        onClick={withId(active ? props.onClickContinue : props.onClickStudy)}
      >
        {active && <AiFillCaretRight aria-hidden="true" />}
        <span>{active ? "Continue" : "Study"}</span>
      </button>

      <DeckActionsMenu
        deckName={deck.name}
        open={props.openMenuDeckId === deck.id}
        onToggle={withId(props.onToggleMenu)}
        onClose={() => props.onCloseMenu?.()}
        {...(active ? { onRestart: withId(props.onClickRestart) } : {})}
        onDownload={withId(props.onClickDownload)}
        onEdit={withId(props.onClickEdit)}
        onDelete={withId(props.onClickDelete)}
      />
    </article>
  );
};
