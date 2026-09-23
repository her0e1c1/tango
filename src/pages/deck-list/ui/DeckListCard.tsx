/**
 * @file Renders a responsive deck card with one primary study action.
 */

import cx from "classnames";
import * as React from "react";
import { AiFillCaretRight } from "react-icons/ai";
import { useTranslation } from "react-i18next";

import type { Deck, DeckId } from "@/entities/deck";
import type { StudySession } from "@/entities/study-session";

import { DeckActionsMenu } from "./DeckActionsMenu";

export interface DeckListCardActions {
  onClickName?: (id: DeckId) => void;
  onClickView?: (id: DeckId) => void;
  onClickContinue?: (id: DeckId) => void;
  onClickStudy?: (id: DeckId) => void;
  onClickRestart?: (id: DeckId) => void;
  onClickHistory?: (id: DeckId) => void;
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
  review?: { due: number; new: number; nextDueAt: number | undefined };
}

const DeckReviewStatus: React.FC<{
  cardCount: number;
  due: number;
  newCount: number;
  nextDueAt: number | undefined;
}> = ({ cardCount, due, newCount, nextDueAt }) => {
  const { t, i18n } = useTranslation();
  if (due + newCount > 0) return <p>{t("deckList.reviewCounts", { due, new: newCount })}</p>;

  const note =
    cardCount === 0
      ? t("deckList.noHeldCards")
      : nextDueAt === undefined
        ? t("deckList.noFilterMatches")
        : t("deckList.nextReview", {
            date: new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium", timeStyle: "short" }).format(nextDueAt),
          });

  return (
    <details>
      <summary className="min-h-touch cursor-pointer content-center rounded-control">
        {t("deckList.noReviewCards")}
      </summary>
      <p className="mt-2">{note}</p>
    </details>
  );
};

export const DeckListCard: React.FC<DeckListCardProps> = (props) => {
  const { t } = useTranslation();
  const { deck, studySession, review } = props;
  const studyAction = review?.due ? "review" : review?.new ? "studyNew" : "study";
  const active = studySession != null;
  const pending = props.isPending?.(deck.id) ?? false;
  const withId = (action?: (id: DeckId) => void) => () => action?.(deck.id);
  const statusId = React.useId();
  const progressId = React.useId();

  return (
    <article
      aria-label={deck.name}
      aria-busy={pending}
      className={cx(
        "relative flex min-w-0 flex-col gap-3 rounded-surface border p-4 shadow-surface",
        active ? "border-accent-primary" : "border-border",
        pending ? "bg-surface-muted" : "bg-surface"
      )}
    >
      <div className="flex min-w-0 items-start gap-2">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            aria-label={t("deckList.openCards", { deckName: deck.name })}
            aria-describedby={active ? `${statusId} ${progressId}` : statusId}
            className="block min-h-touch w-full min-w-0 break-words rounded-control text-left text-body font-semibold text-ink hover:text-accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            onClick={withId(props.onClickName)}
            disabled={pending}
          >
            {deck.name}
          </button>
          <p id={statusId} className="mt-1 flex flex-wrap items-baseline gap-x-2 text-caption text-ink-muted">
            <span>{t("deckList.cardCount", { count: props.cardCount })}</span>
          </p>
        </div>
        <DeckActionsMenu
          deckName={deck.name}
          open={props.openMenuDeckId === deck.id}
          disabled={pending}
          onToggle={withId(props.onToggleMenu)}
          onClose={() => props.onCloseMenu?.()}
          onView={withId(props.onClickView)}
          {...(active ? { onRestart: withId(props.onClickRestart) } : {})}
          onHistory={withId(props.onClickHistory)}
          onDownload={withId(props.onClickDownload)}
          onEdit={withId(props.onClickEdit)}
          onDelete={withId(props.onClickDelete)}
        />
      </div>
      {studySession != null && (
        <div className="space-y-2">
          <p id={progressId} className="text-caption text-accent-primary">
            {t("deckList.studyPosition", {
              position: studySession.currentIndex + 1,
              total: studySession.cardOrderIds.length,
            })}
          </p>
          <div aria-hidden="true" className="h-1 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-accent-primary"
              style={{
                width: `${String(studySession.cardOrderIds.length === 0 ? 0 : (studySession.currentIndex / studySession.cardOrderIds.length) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {review !== undefined && (
        <div className="min-w-0 text-caption text-ink-muted">
          <DeckReviewStatus
            cardCount={props.cardCount}
            due={review.due}
            newCount={review.new}
            nextDueAt={review.nextDueAt}
          />
        </div>
      )}

      <button
        type="button"
        aria-label={t(
          active
            ? "deckList.continueDeck"
            : studyAction === "review"
              ? "deckList.reviewDeck"
              : studyAction === "studyNew"
                ? "deckList.studyNewDeck"
                : "deckList.studyDeck",
          { deckName: deck.name }
        )}
        className={cx(
          "inline-flex min-h-touch w-full items-center justify-center gap-2 rounded-control px-3 py-2 text-body font-semibold hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50",
          active ? "bg-accent-primary text-ink-inverse" : "bg-surface-muted text-accent-primary"
        )}
        onClick={withId(active ? props.onClickContinue : props.onClickStudy)}
        disabled={pending}
      >
        {active && <AiFillCaretRight aria-hidden="true" />}
        {t(
          active
            ? "deckList.continue"
            : studyAction === "review"
              ? "deckList.review"
              : studyAction === "studyNew"
                ? "deckList.studyNew"
                : "deckList.study"
        )}
      </button>
    </article>
  );
};
