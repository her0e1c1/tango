import type React from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/ui/button";

export interface StudySessionStartProps {
  deckName: string;
  maxNumberOfCardsToLearn: number;
  cardsLength: number;
  disabled?: boolean;
  filterSlot?: React.ReactNode;
  onClickStart?: () => void;
}

export const StudySessionStart: React.FC<StudySessionStartProps> = (props) => {
  const { t } = useTranslation();
  const sessionCardsLength =
    props.maxNumberOfCardsToLearn <= 0 ? props.cardsLength : Math.min(props.cardsLength, props.maxNumberOfCardsToLearn);
  const hasCards = props.cardsLength > 0;
  const matchingCopy = hasCards
    ? t("studyStart.matchingCards", { count: props.cardsLength })
    : t("studyStart.noMatchingCards");
  const sessionCardCount = t("studyStart.cardCount", { count: sessionCardsLength });

  return (
    <div className="mx-auto w-full max-w-content space-y-section-gap pb-[calc(8.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <header className="max-w-reading">
        <p className="text-caption font-bold uppercase tracking-wider text-accent-primary">{t("studyStart.eyebrow")}</p>
        <h1 className="mt-1 line-clamp-3 break-words text-display font-bold text-ink">{props.deckName}</h1>
        <p className="mt-2 text-body text-ink-muted">{t("studyStart.description")}</p>
      </header>
      <div className="grid items-start gap-section-gap lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
        <section aria-label={t("studyStart.filtersAria")} className="min-w-0 lg:col-start-1 lg:row-start-1">
          {props.filterSlot}
        </section>
        {/* One responsive summary keeps live updates and keyboard focus attached to a single CTA. */}
        <section
          aria-labelledby="study-session-summary"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface-elevated/95 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pl-[calc(var(--spacing-shell-gutter)+env(safe-area-inset-left))] pr-[calc(var(--spacing-shell-gutter)+env(safe-area-inset-right))] pt-3 shadow-elevated backdrop-blur-md md:static md:rounded-surface md:border md:bg-surface md:p-4 md:shadow-surface md:backdrop-blur-none lg:sticky lg:top-section-gap lg:col-start-2 lg:row-start-1 lg:p-5"
        >
          <div className="mx-auto flex w-full max-w-content min-w-0 items-center gap-3 md:block md:max-w-none">
            <div aria-live="polite" className="min-w-0 flex-1">
              <p className="hidden text-caption font-bold uppercase tracking-wider text-accent-primary md:block">
                {t("studyStart.session")}
              </p>
              <h2
                id="study-session-summary"
                aria-label={t("studyStart.sessionCardCount", { count: sessionCardsLength })}
                className="break-words text-body font-bold text-ink md:mt-1 md:text-title"
              >
                {sessionCardCount}
                <span className="hidden md:inline">{t("studyStart.sessionSuffix")}</span>
              </h2>
              <p className="mt-0.5 line-clamp-2 text-caption text-ink-muted md:mt-2 md:line-clamp-none md:text-body">
                {matchingCopy}
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              className="shrink-0 whitespace-nowrap md:mt-5 md:w-full md:px-6 md:py-3 md:text-lg"
              disabled={!hasCards || Boolean(props.disabled)}
              {...(props.onClickStart !== undefined ? { onClick: props.onClickStart } : {})}
            >
              {t("studyStart.start", { count: sessionCardsLength })}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};
