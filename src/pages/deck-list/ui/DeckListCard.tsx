/**
 * @file Renders a compact deck row with one primary study action.
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
      <summary className="cursor-pointer rounded-control">{t("deckList.noReviewCards")}</summary>
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

  return (
    <article
      aria-label={deck.name}
      aria-busy={pending}
      className={cx(
        "relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-b border-border px-4 py-4 last:border-b-0 sm:gap-x-6 sm:px-5",
        review === undefined ? "sm:grid-cols-[minmax(0,1fr)_10.25rem]" : "sm:grid-cols-[minmax(0,1fr)_11rem_10.25rem]",
        pending && "bg-surface-muted"
      )}
    >
      <div className="col-start-1 row-start-1 min-w-0">
        <button
          type="button"
          aria-label={t("deckList.openCards", { deckName: deck.name })}
          aria-describedby={statusId}
          className="block w-full min-w-0 break-words rounded-control text-left text-body font-semibold text-ink hover:text-accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          onClick={withId(props.onClickName)}
          disabled={pending}
        >
          {deck.name}
        </button>
        <p id={statusId} className="mt-1 flex flex-wrap items-baseline gap-x-2 text-caption text-ink-muted">
          <span>{t("deckList.cardCount", { count: props.cardCount })}</span>{" "}
          {studySession != null && (
            <span className="text-accent-primary">
              {t("deckList.studyPosition", {
                position: studySession.currentIndex + 1,
                total: studySession.cardOrderIds.length,
              })}
            </span>
          )}
        </p>
      </div>

      {review !== undefined && (
        <div className="col-start-1 row-start-2 min-w-0 text-caption text-ink-muted sm:col-start-2 sm:row-start-1">
          <DeckReviewStatus
            cardCount={props.cardCount}
            due={review.due}
            newCount={review.new}
            nextDueAt={review.nextDueAt}
          />
        </div>
      )}

      <div
        className={cx(
          "col-start-2 row-span-2 row-start-1 flex flex-col items-end gap-1 sm:row-span-1 sm:flex-row sm:items-center sm:justify-end sm:gap-2",
          review !== undefined && "sm:col-start-3"
        )}
      >
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
          className="inline-flex min-h-touch shrink-0 items-center justify-center gap-1 rounded-control bg-accent-primary px-3 text-caption font-semibold text-ink-inverse hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50 sm:w-28"
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
    </article>
  );
};
