/**
 * @file Renders the Deck List presentation from prepared sections and callbacks.
 */

import * as React from "react";
import { AiOutlineDown, AiOutlinePlus, AiOutlineUpload } from "react-icons/ai";
import { useTranslation } from "react-i18next";

import type { Deck, DeckId } from "@/entities/deck";
import type { StudySession } from "@/entities/study-session";
import { ActionsMenu } from "@/shared/ui/actions-menu";
import { Button } from "@/shared/ui/button";

import { DeckListCard, type DeckListCardActions } from "./DeckListCard";

interface DeckListItem {
  deck: Deck;
  cardCount: number;
  studySession?: StudySession;
  review?: { due: number; new: number; nextDueAt: number | undefined };
}

interface StudyingDeckListItem extends DeckListItem {
  studySession: StudySession;
}

interface DeckListEmptyProps {
  reason: "checking" | "error" | "confirmed-empty";
  onRetry?: (() => void) | undefined;
}

export interface DeckListProps {
  sections: {
    studying: StudyingDeckListItem[];
    other: DeckListItem[];
    reviewNow?: DeckListItem[] | undefined;
    totals?: { due: number; new: number } | undefined;
  };
  empty?: DeckListEmptyProps | undefined;
  deckCard?: DeckListCardActions;
  onCreateDeck: () => void;
  onImportDeck: () => void;
}

/**
 * Renders the Deck List presentation from prepared sections and action callbacks.
 */
export const DeckList: React.FC<DeckListProps> = (props) => {
  const { t } = useTranslation();
  const [openMenuDeckId, setOpenMenuDeckId] = React.useState<DeckId>();
  const [actionsOpen, setActionsOpen] = React.useState(false);
  const total = props.sections.studying.length + props.sections.other.length + (props.sections.reviewNow?.length ?? 0);
  const toggleMenu = (id: DeckId) => {
    setActionsOpen(false);
    setOpenMenuDeckId((value) => (value === id ? undefined : id));
  };
  const closeMenu = () => setOpenMenuDeckId(undefined);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="break-words text-title font-semibold text-ink">{t("deckList.title")}</h1>
          <span className="shrink-0 text-caption text-ink-muted">{t("deckList.count", { count: total })}</span>
        </div>
        <ActionsMenu
          mobileSheet
          groupLabel={t("deckList.listActions")}
          triggerLabel={t("deckList.listActions")}
          menuLabel={t("deckList.listActions")}
          triggerContent={
            <>
              <AiOutlinePlus aria-hidden="true" />
              {t("deckList.listActions")}
              <AiOutlineDown aria-hidden="true" />
            </>
          }
          open={actionsOpen}
          onToggle={() => {
            closeMenu();
            setActionsOpen((open) => !open);
          }}
          onClose={() => setActionsOpen(false)}
          items={[
            {
              key: "create",
              label: t("deckList.create"),
              icon: <AiOutlinePlus aria-hidden="true" />,
              onSelect: props.onCreateDeck,
            },
            {
              key: "import",
              label: t("deckList.import"),
              icon: <AiOutlineUpload aria-hidden="true" />,
              onSelect: props.onImportDeck,
            },
          ]}
        />
      </div>
      {total > 0 && props.sections.totals !== undefined && (
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2 text-caption text-ink">
          <p>{t("deckList.reviewCounts", props.sections.totals)}</p>
          <details className="text-ink-muted">
            <summary className="cursor-pointer rounded-control">{t("deckList.aboutCounts")}</summary>
            <p className="mt-2 max-w-reading">{t("deckList.localCountsNote")}</p>
          </details>
        </div>
      )}
      {total === 0 && props.empty ? (
        props.empty.reason === "checking" ? (
          <div
            role="status"
            aria-live="polite"
            className="rounded-surface border border-border bg-surface p-6 text-center text-ink shadow-surface"
          >
            <p className="text-body text-ink-muted">{t("deckList.empty.checking")}</p>
          </div>
        ) : props.empty.reason === "error" ? (
          <section
            role="alert"
            aria-live="assertive"
            aria-labelledby="deck-list-empty-error-title"
            className="rounded-surface border border-border bg-surface p-6 text-center text-ink shadow-surface"
          >
            <h2 id="deck-list-empty-error-title" className="text-title font-bold text-ink">
              {t("deckList.empty.errorTitle")}
            </h2>
            <p className="mt-2 text-body text-ink-muted">{t("deckList.empty.errorDescription")}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {props.empty.onRetry ? (
                <Button variant="primary" onClick={props.empty.onRetry}>
                  {t("deckList.empty.retry")}
                </Button>
              ) : null}
              <Button variant="secondary" onClick={props.onCreateDeck}>
                {t("deckList.create")}
              </Button>
              <Button variant="quiet" onClick={props.onImportDeck}>
                {t("deckList.import")}
              </Button>
            </div>
          </section>
        ) : (
          <section
            aria-labelledby="deck-list-empty-confirmed-title"
            className="rounded-surface border border-border bg-surface p-6 text-center text-ink shadow-surface"
          >
            <h2 id="deck-list-empty-confirmed-title" className="text-title font-bold text-ink">
              {t("deckList.empty.confirmedTitle")}
            </h2>
            <p className="mt-2 text-body text-ink-muted">{t("deckList.empty.confirmedDescription")}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button variant="primary" onClick={props.onCreateDeck}>
                {t("deckList.create")}
              </Button>
              <Button variant="secondary" onClick={props.onImportDeck}>
                {t("deckList.import")}
              </Button>
            </div>
          </section>
        )
      ) : null}
      {total > 0 && (
        <section aria-label={t("deckList.title")} className="space-y-6">
          {(
            [
              ["studying", props.sections.studying],
              ["reviewNow", props.sections.reviewNow ?? []],
              ["other", props.sections.other],
            ] as const
          ).map(([group, items]) =>
            items.length > 0 ? (
              <section key={group} aria-label={t(`deckList.groups.${group}`)}>
                <h2 className="mb-3 flex items-baseline justify-between gap-3 text-caption font-semibold text-ink-muted">
                  {t(`deckList.groups.${group}`)}{" "}
                  <span className="font-normal">{t("deckList.count", { count: items.length })}</span>
                </h2>
                <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((item) => (
                    <DeckListCard
                      key={item.deck.id}
                      deck={item.deck}
                      cardCount={item.cardCount}
                      {...(item.review ? { review: item.review } : {})}
                      {...(item.studySession != null ? { studySession: item.studySession } : {})}
                      {...props.deckCard}
                      openMenuDeckId={openMenuDeckId}
                      onToggleMenu={toggleMenu}
                      onCloseMenu={closeMenu}
                    />
                  ))}
                </div>
              </section>
            ) : null
          )}
        </section>
      )}
    </>
  );
};
