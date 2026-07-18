import type React from "react";

import { Button } from "@/shared/components";
import { Layout, type LayoutProps } from "@/shared/components/layout/Layout";

export interface DeckStartTemplateProps {
  layout?: LayoutProps;
  deckName: string;
  maxNumberOfCardsToLearn: number;
  cardsLength: number;
  filterSlot?: React.ReactNode;
  onClickStart?: () => void;
}

const cardsLabel = (count: number) => `${count} ${count === 1 ? "card" : "cards"}`;

export const DeckStartTemplate: React.FC<DeckStartTemplateProps> = (props) => {
  const sessionCardsLength = Math.min(props.cardsLength, props.maxNumberOfCardsToLearn);
  const hasCards = props.cardsLength > 0;
  const matchingCopy = hasCards
    ? `${cardsLabel(props.cardsLength)} ${props.cardsLength === 1 ? "matches" : "match"} your filters.`
    : "No cards match your filters.";

  return (
    <Layout showHeader {...props.layout}>
      <div className="mx-auto w-full max-w-reading space-y-section-gap">
        <header>
          <p className="text-caption font-bold uppercase tracking-wider text-accent-primary">Study setup</p>
          <h1 className="mt-1 line-clamp-3 break-words text-display font-bold text-ink">{props.deckName}</h1>
          <p className="mt-2 text-body text-ink-muted">Choose what to review, then begin a focused session.</p>
        </header>
        <section className="rounded-surface border border-border bg-surface p-4 shadow-surface md:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div aria-live="polite" className="min-w-0">
              <p className="text-caption font-bold uppercase tracking-wider text-accent-primary">Session</p>
              <h2 className="mt-1 break-words text-title font-bold text-ink">
                {cardsLabel(sessionCardsLength)} in this session
              </h2>
              <p className="mt-1 text-caption text-ink-muted">{matchingCopy}</p>
            </div>
            <Button
              variant="primary"
              size="lg"
              className="w-full shrink-0 sm:w-auto"
              disabled={!hasCards}
              {...(props.onClickStart !== undefined ? { onClick: props.onClickStart } : {})}
            >
              Start {cardsLabel(sessionCardsLength)}
            </Button>
          </div>
        </section>
        {props.filterSlot}
      </div>
    </Layout>
  );
};
