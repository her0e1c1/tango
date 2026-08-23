/**
 * @file Defines the Deck List Page's Deck Card presentation component.
 * The component renders props and reports user intent through callbacks while data access stays
 * outside the view.
 */

import cx from "classnames";
import * as React from "react";
import { AiFillCaretRight, AiOutlineCloud } from "react-icons/ai";

import type { Deck, DeckId } from "@/entities/deck";
import type { StudySession } from "@/entities/study-session";

import { DeckActionsMenu } from "./DeckActionsMenu";

export interface DeckListCardActions {
  onClickName?: (id: DeckId) => void;
  onClickContinue?: (id: DeckId) => void;
  onClickStudy?: (id: DeckId) => void;
  onClickRestart?: (id: DeckId) => void;
  onClickDownload?: (id: DeckId) => void;
  onClickEdit?: (id: DeckId) => void;
  onClickDelete?: (id: DeckId) => void;
  isPending?: (id: DeckId) => boolean;
}

interface DeckListCardMenuState {
  openMenuDeckId?: DeckId | undefined;
  onToggleMenu?: (id: DeckId) => void;
  onCloseMenu?: () => void;
}

export interface DeckListCardProps extends DeckListCardActions, DeckListCardMenuState {
  deck: Deck;
  cardCount: number;
  studySession?: StudySession;
}

/**
 * Formats a deck's last-study time for display in the deck list.
 * Decks that have never been studied receive a clear fallback instead of an invalid date.
 */
const formatLastStudied = (timestamp: number): string => {
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (elapsedSeconds < 60) return "just now";
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) return `${String(elapsedMinutes)}m ago`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${String(elapsedHours)}h ago`;
  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 30) return `${String(elapsedDays)}d ago`;
  const elapsedMonths = Math.floor(elapsedDays / 30);
  if (elapsedMonths < 12) return `${String(elapsedMonths)}mo ago`;
  return `${String(Math.floor(elapsedMonths / 12))}y ago`;
};

const primaryActionClassName =
  "inline-flex min-h-touch shrink-0 items-center justify-center gap-1 rounded-control px-3 text-caption font-semibold transition-colors duration-fast ease-calm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus";

const DeckListCardStatus: React.FC<{
  deck: DeckListCardProps["deck"];
  active: boolean;
  studySession: DeckListCardProps["studySession"];
  progressValue: number;
  cardCount: number;
  statusId: string;
}> = ({ deck, active, studySession, progressValue, cardCount, statusId }) => (
  <span id={statusId} className="mt-1 flex min-w-0 items-center gap-2 text-caption text-ink-muted">
    {deck.category !== "" && (
      <span className="max-w-28 truncate rounded-pill bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink">
        {deck.category}
      </span>
    )}
    <span className="truncate">
      {active && studySession
        ? `${String(progressValue)} / ${String(studySession.cardOrderIds.length)} · ${formatLastStudied(studySession.lastStudiedAt)}`
        : `${String(cardCount)} ${cardCount === 1 ? "card" : "cards"}`}
    </span>
  </span>
);

const DeckListCardProgressBar: React.FC<{
  active: boolean;
  progressValue: number;
  progressPercent: number;
  cardCount: number;
  deckName: string;
}> = ({ active, progressValue, progressPercent, cardCount, deckName }) => {
  if (!active) return null;
  return (
    <span
      role="progressbar"
      aria-label={`Progress for ${deckName}`}
      aria-valuemin={0}
      aria-valuemax={cardCount}
      aria-valuenow={progressValue}
      className="mt-2 block h-1 overflow-hidden rounded-pill bg-surface-muted"
    >
      <span className="block h-full rounded-pill bg-accent-primary" style={{ width: `${String(progressPercent)}%` }} />
    </span>
  );
};

/**
 * Renders the Deck Card user interface.
 * Summarizes a deck, its tags, study progress, and available actions while reflecting pending
 * operations.
 */
export const DeckListCard: React.FC<DeckListCardProps> = (props) => {
  const { deck, studySession } = props;
  const active = studySession != null;
  const studyCardCount = studySession?.cardOrderIds.length ?? 0;
  const progressValue = active ? studySession.currentIndex + 1 : 0;
  const progressPercent = active ? Math.min(100, (progressValue / studyCardCount) * 100) : 0;
  const pending = props.isPending?.(deck.id) ?? false;
  /**
   * Wraps an optional action so it receives the current item's identifier when invoked.
   * Presentation markup can pass a parameterless callback while domain actions still receive the
   * item they should change.
   */
  const withId = (action?: (id: DeckId) => void) => () => action?.(deck.id);
  const statusId = React.useId();

  return (
    <article
      aria-busy={pending}
      className={cx(
        "relative flex min-h-20 items-center gap-2 border-b border-border px-3 py-2 transition-colors duration-fast ease-calm last:border-b-0 dark:border-black",
        pending ? "bg-surface-muted" : "hover:bg-surface-muted"
      )}
    >
      <div className="min-w-0 flex-1 px-1 py-1">
        <button
          type="button"
          aria-label={`View ${deck.name}`}
          aria-describedby={statusId}
          className="flex w-full min-w-0 items-center gap-1.5 rounded-control text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          onClick={withId(props.onClickName)}
          disabled={pending}
        >
          <span className="truncate text-body font-semibold text-ink">{deck.name}</span>
          {deck.isPublic ? (
            <span role="img" aria-label="Public deck" className="shrink-0 text-ink-muted">
              <AiOutlineCloud aria-hidden="true" size={16} />
            </span>
          ) : null}
        </button>

        <DeckListCardStatus
          deck={deck}
          active={active}
          studySession={studySession}
          progressValue={progressValue}
          cardCount={props.cardCount}
          statusId={statusId}
        />

        <DeckListCardProgressBar
          active={active}
          progressValue={progressValue}
          progressPercent={progressPercent}
          cardCount={studyCardCount}
          deckName={deck.name}
        />
      </div>

      <button
        type="button"
        aria-label={`${active ? "Continue" : "Study"} ${deck.name}`}
        className={cx(
          primaryActionClassName,
          active
            ? "bg-accent-primary text-ink-inverse hover:opacity-90"
            : "border border-border bg-transparent text-ink hover:bg-surface-muted"
        )}
        onClick={withId(active ? props.onClickContinue : props.onClickStudy)}
        disabled={pending}
      >
        {active && <AiFillCaretRight aria-hidden="true" />}
        <span>{active ? "Continue" : "Study"}</span>
      </button>

      <DeckActionsMenu
        deckName={deck.name}
        open={props.openMenuDeckId === deck.id}
        disabled={pending}
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
