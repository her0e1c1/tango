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
 * Renders one labeled group of Deck List items.
 */
const DeckListSection: React.FC<{
  title: string;
  note: string;
  items: DeckListItem[];
  actions: DeckListCardActions | undefined;
  openMenuDeckId: DeckId | undefined;
  onToggleMenu: (id: DeckId) => void;
  onCloseMenu: () => void;
}> = ({ title, note, items, actions, openMenuDeckId, onToggleMenu, onCloseMenu }) => {
  const headingId = React.useId();
  const { t } = useTranslation();
  if (items.length === 0) return null;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3 px-1">
        <h2 id={headingId} className="text-caption font-bold uppercase tracking-wide text-ink-muted">
          {title}
        </h2>
        <span className="shrink-0 text-caption text-ink-muted">
          {t("deckList.count", { count: items.length })} · {note}
        </span>
      </div>
      <div className="rounded-surface border border-border bg-surface shadow-surface dark:border-black">
        {items.map((item) => (
          <DeckListCard
            key={item.deck.id}
            deck={item.deck}
            cardCount={item.cardCount}
            {...(item.review ? { review: item.review } : {})}
            {...(item.studySession != null ? { studySession: item.studySession } : {})}
            {...actions}
            openMenuDeckId={openMenuDeckId}
            onToggleMenu={onToggleMenu}
            onCloseMenu={onCloseMenu}
          />
        ))}
      </div>
    </section>
  );
};

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
        <h1 className="break-words text-title font-bold text-ink">{t("deckList.title")}</h1>
        <div className="flex items-center gap-3">
          <span className="shrink-0 text-caption text-ink-muted">{t("deckList.count", { count: total })}</span>
          <ActionsMenu
            groupLabel={t("deckList.listActions")}
            triggerLabel={t("deckList.listActions")}
            menuLabel={t("deckList.listActions")}
            triggerContent={
              <>
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
      </div>
      {total > 0 && props.sections.totals !== undefined && (
        <div className="text-body text-ink">
          <p>{t("deckList.reviewCounts", props.sections.totals)}</p>
          <p className="text-caption text-ink-muted">{t("deckList.localCountsNote")}</p>
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
      <DeckListSection
        title={t("deckList.sections.studyingTitle")}
        note={t("deckList.sections.studyingNote")}
        items={props.sections.studying}
        actions={props.deckCard}
        openMenuDeckId={openMenuDeckId}
        onToggleMenu={toggleMenu}
        onCloseMenu={closeMenu}
      />
      <DeckListSection
        title={t("deckList.sections.reviewTitle")}
        note={t("deckList.sections.reviewNote")}
        items={props.sections.reviewNow ?? []}
        actions={props.deckCard}
        openMenuDeckId={openMenuDeckId}
        onToggleMenu={toggleMenu}
        onCloseMenu={closeMenu}
      />
      <DeckListSection
        title={t("deckList.sections.otherTitle")}
        note={t("deckList.sections.otherNote")}
        items={props.sections.other}
        actions={props.deckCard}
        openMenuDeckId={openMenuDeckId}
        onToggleMenu={toggleMenu}
        onCloseMenu={closeMenu}
      />
    </>
  );
};
