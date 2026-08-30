import { useEffect, useRef, type FC } from "react";

import { Button } from "@/shared/ui/button";

export interface StudyCompletionProps {
  cardCount: number;
  onClickBack: () => void;
}

const cardsLabel = (count: number) => `${String(count)} ${count === 1 ? "card" : "cards"}`;

export const StudyCompletion: FC<StudyCompletionProps> = ({ cardCount, onClickBack }) => {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // The swipe control disappears asynchronously, so focus the result to make the transition perceivable.
    titleRef.current?.focus();
  }, []);

  return (
    <section
      aria-labelledby="study-completion-title"
      className="mx-auto w-full max-w-reading rounded-surface border border-border bg-surface p-6 text-center text-ink shadow-surface"
    >
      <p className="text-caption font-bold uppercase tracking-wider text-accent-primary">Session complete</p>
      <h1 ref={titleRef} id="study-completion-title" tabIndex={-1} className="mt-1 text-display font-bold">
        Study complete
      </h1>
      <p className="mt-3 text-body text-ink-muted">You studied {cardsLabel(cardCount)}.</p>
      <Button className="mt-6" variant="primary" size="lg" onClick={onClickBack}>
        Back to deck list
      </Button>
    </section>
  );
};
