/**
 * @file Renders the Deck List presentation from prepared sections and callbacks.
 */

import * as React from "react";
import { AiOutlineBarChart, AiOutlineDown, AiOutlinePlus, AiOutlineUpload } from "react-icons/ai";
import { useTranslation } from "react-i18next";

import type { Deck, DeckId } from "@/entities/deck";
import type { StudySession } from "@/entities/study-session";
import { ActionsMenu } from "@/shared/ui/actions-menu";

import { DeckListCard, type DeckListCardActions } from "./DeckListCard";

interface DeckListItem {
  deck: Deck;
  cardCount: number;
  studySession?: StudySession;
}

interface StudyingDeckListItem extends DeckListItem {
  studySession: StudySession;
}

export interface DeckListProps {
  sections: {
    studying: StudyingDeckListItem[];
    other: DeckListItem[];
  };
  deckCard?: DeckListCardActions;
  onCreateDeck: () => void;
  onImportDeck: () => void;
  onStudyHistory: () => void;
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
  const total = props.sections.studying.length + props.sections.other.length;
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
              {
                key: "history",
                label: t("studyHistory.title"),
                icon: <AiOutlineBarChart aria-hidden="true" />,
                onSelect: props.onStudyHistory,
              },
            ]}
          />
        </div>
      </div>
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
