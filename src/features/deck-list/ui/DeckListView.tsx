/**
 * @file Renders the Deck List presentation from prepared sections and callbacks.
 */

import * as React from "react";

import type { DeckListItem, DeckListSections } from "../model/useDeckListState";

import { DeckListCard, type DeckListCardActions } from "./DeckListCard";

export interface DeckListViewProps {
  sections: DeckListSections;
  deckCard?: DeckListCardActions;
}

/**
 * Formats the count label text shown to the user.
 * The helper keeps wording and singular or plural rules consistent across the screen.
 */
const countLabel = (count: number) => `${String(count)} ${count === 1 ? "deck" : "decks"}`;

/**
 * Renders one labeled group of Deck List items.
 */
const DeckListSection: React.FC<{
  title: string;
  note: string;
  items: DeckListItem[];
  actions: DeckListCardActions | undefined;
}> = ({ title, note, items, actions }) => {
  const headingId = React.useId();
  if (items.length === 0) return null;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3 px-1">
        <h2 id={headingId} className="text-caption font-bold uppercase tracking-wide text-ink-muted">
          {title}
        </h2>
        <span className="shrink-0 text-caption text-ink-muted">
          {countLabel(items.length)} · {note}
        </span>
      </div>
      <div className="rounded-surface border border-border bg-surface shadow-surface dark:border-black">
        {items.map((item) => (
          <DeckListCard
            key={item.deck.id}
            deck={item.deck}
            cardCount={item.cardCount}
            {...(item.studyProgress != null ? { studyProgress: item.studyProgress } : {})}
            {...actions}
          />
        ))}
      </div>
    </section>
  );
};

/**
 * Renders the Deck List presentation from prepared sections and action callbacks.
 */
export const DeckListView: React.FC<DeckListViewProps> = (props) => {
  const total = props.sections.studying.length + props.sections.other.length;

  return (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="break-words text-title font-bold text-ink">Decks</h1>
        <span className="shrink-0 text-caption text-ink-muted">{countLabel(total)}</span>
      </div>
      <DeckListSection title="Studying" note="recent first" items={props.sections.studying} actions={props.deckCard} />
      <DeckListSection title="Other decks" note="A–Z" items={props.sections.other} actions={props.deckCard} />
    </>
  );
};
