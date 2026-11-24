import type { FC } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/ui/button";

export interface StudyCompletionProps {
  cardCount: number;
  onClickBack: () => void;
}

function focusCompletionTitle(title: HTMLHeadingElement | null): void {
  // The swipe control disappears asynchronously, so focus the result when it mounts.
  title?.focus();
}

export const StudyCompletion: FC<StudyCompletionProps> = ({ cardCount, onClickBack }) => {
  const { t } = useTranslation();
  return (
    <section
      aria-labelledby="study-completion-title"
      className="mx-auto w-full max-w-reading rounded-surface border border-border bg-surface p-6 text-center text-ink shadow-surface"
    >
      <p className="text-caption font-bold uppercase tracking-wider text-accent-primary">
        {t("studySession.completion.eyebrow")}
      </p>
      <h1 ref={focusCompletionTitle} id="study-completion-title" tabIndex={-1} className="mt-1 text-display font-bold">
        {t("studySession.completion.title")}
      </h1>
      <p className="mt-3 text-body text-ink-muted">{t("studySession.completion.summary", { count: cardCount })}</p>
      <Button className="mt-6" variant="primary" size="lg" onClick={onClickBack}>
        {t("studySession.completion.back")}
      </Button>
    </section>
  );
};
