import { useEffect, useRef, type FC } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/ui/button";

export interface StudyCompletionProps {
  cardCount: number;
  onClickBack: () => void;
}

export const StudyCompletion: FC<StudyCompletionProps> = ({ cardCount, onClickBack }) => {
  const { t } = useTranslation();
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
      <p className="text-caption font-bold uppercase tracking-wider text-accent-primary">
        {t("studySession.completion.eyebrow")}
      </p>
      <h1 ref={titleRef} id="study-completion-title" tabIndex={-1} className="mt-1 text-display font-bold">
        {t("studySession.completion.title")}
      </h1>
      <p className="mt-3 text-body text-ink-muted">{t("studySession.completion.summary", { count: cardCount })}</p>
      <Button className="mt-6" variant="primary" size="lg" onClick={onClickBack}>
        {t("studySession.completion.back")}
      </Button>
    </section>
  );
};
