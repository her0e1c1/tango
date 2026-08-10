/**
 * @file Composes the deck feature's complete Deck List Template screen.
 * Data and callbacks arrive through props, which keeps this presentation usable in both a live
 * container and Storybook.
 */

import * as React from "react";

import type { Deck } from "@/entities/deck";
import { Layout } from "@/shared/ui/layout";

import { DeckListCard, type DeckListCardActions, type DeckListStudyProgress } from "./DeckListCard";

export interface DeckListItem {
  deck: Deck;
  cardCount: number;
  studyProgress?: DeckListStudyProgress;
}

export interface DeckListSections {
  studying: DeckListItem[];
  other: DeckListItem[];
}

export interface DeckListTemplateProps {
  sections: DeckListSections;
  layout?: React.ComponentProps<typeof Layout>;
  deckCard?: DeckListCardActions;
  feedbackSlot?: React.ReactNode;
  dialogSlot?: React.ReactNode;
}

/**
 * Formats the count label text shown to the user.
 * The helper keeps wording and singular or plural rules consistent across the screen.
 */
const countLabel = (count: number) => `${count} ${count === 1 ? "deck" : "decks"}`;

/**
 * Composes the complete Deck List Section screen from reusable UI components.
 * All data and callbacks arrive through props, allowing the same screen to run in containers,
 * tests, and Storybook.
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
 * Composes the complete Deck List Template screen from reusable UI components.
 * All data and callbacks arrive through props, allowing the same screen to run in containers,
 * tests, and Storybook.
 */
export const DeckListView: React.FC<DeckListTemplateProps> = (props) => {
  const total = props.sections.studying.length + props.sections.other.length;

  return (
    <Layout showHeader {...props.layout}>
      {props.feedbackSlot}
      {props.dialogSlot}
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="break-words text-title font-bold text-ink">Decks</h1>
        <span className="shrink-0 text-caption text-ink-muted">{countLabel(total)}</span>
      </div>
      <DeckListSection title="Studying" note="recent first" items={props.sections.studying} actions={props.deckCard} />
      <DeckListSection title="Other decks" note="A–Z" items={props.sections.other} actions={props.deckCard} />
    </Layout>
  );
};
