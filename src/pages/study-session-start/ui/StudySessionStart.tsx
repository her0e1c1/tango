import type React from "react";

import { Button } from "@/shared/ui/button";

export interface StudySessionStartProps {
  deckName: string;
  maxNumberOfCardsToLearn: number;
  cardsLength: number;
  filterSlot?: React.ReactNode;
  onClickStart?: () => void;
}

const cardsLabel = (count: number) => `${String(count)} ${count === 1 ? "card" : "cards"}`;

export const StudySessionStart: React.FC<StudySessionStartProps> = (props) => {
  const sessionCardsLength =
    props.maxNumberOfCardsToLearn <= 0 ? props.cardsLength : Math.min(props.cardsLength, props.maxNumberOfCardsToLearn);
  const hasCards = props.cardsLength > 0;
  const matchingCopy = hasCards
    ? `${cardsLabel(props.cardsLength)} ${props.cardsLength === 1 ? "matches" : "match"} your filters.`
    : "No cards match your filters.";

  return (
    <div className="mx-auto w-full max-w-content space-y-section-gap">
      <header className="max-w-reading">
        <p className="text-caption font-bold uppercase tracking-wider text-accent-primary">Study setup</p>
        <h1 className="mt-1 line-clamp-3 break-words text-display font-bold text-ink">{props.deckName}</h1>
        <p className="mt-2 text-body text-ink-muted">Choose what to review, then begin a focused session.</p>
      </header>
      <div className="grid items-start gap-section-gap lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
        <section
          aria-labelledby="study-session-summary"
          className="rounded-surface border border-border bg-surface p-4 shadow-surface lg:sticky lg:top-section-gap lg:col-start-2 lg:row-start-1 lg:p-5"
        >
          <div aria-live="polite" className="min-w-0">
            <p className="text-caption font-bold uppercase tracking-wider text-accent-primary">Session</p>
            <h2 id="study-session-summary" className="mt-1 break-words text-title font-bold text-ink">
              {cardsLabel(sessionCardsLength)} in this session
            </h2>
            <p className="mt-2 text-body text-ink-muted">{matchingCopy}</p>
          </div>
          <Button
            variant="primary"
            size="lg"
            className="mt-5 w-full"
            disabled={!hasCards}
            {...(props.onClickStart !== undefined ? { onClick: props.onClickStart } : {})}
          >
            Start {cardsLabel(sessionCardsLength)}
          </Button>
        </section>
        <section aria-label="Study filters" className="min-w-0 lg:col-start-1 lg:row-start-1">
          {props.filterSlot}
        </section>
      </div>
    </div>
  );
};
