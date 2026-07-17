import * as React from "react";

import { DeckCard, type DeckCardActions, type DeckListStudyProgress } from "@/features/deck/components/DeckCard";
import { Layout } from "@/shared/components/layout/Layout";

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
  deckCard?: DeckCardActions;
  feedbackSlot?: React.ReactNode;
}

const countLabel = (count: number) => `${count} ${count === 1 ? "deck" : "decks"}`;

const DeckListSection: React.FC<{
  title: string;
  note: string;
  items: DeckListItem[];
  actions: DeckCardActions | undefined;
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
      <div className="rounded-surface border border-border bg-surface shadow-surface">
        {items.map((item) => (
          <DeckCard
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

export const DeckListTemplate: React.FC<DeckListTemplateProps> = (props) => {
  const total = props.sections.studying.length + props.sections.other.length;

  return (
    <Layout showHeader {...props.layout}>
      {props.feedbackSlot}
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="break-words text-title font-bold text-ink">Decks</h1>
        <span className="shrink-0 text-caption text-ink-muted">{countLabel(total)}</span>
      </div>
      <DeckListSection title="Studying" note="recent first" items={props.sections.studying} actions={props.deckCard} />
      <DeckListSection title="Other decks" note="A–Z" items={props.sections.other} actions={props.deckCard} />
    </Layout>
  );
};
