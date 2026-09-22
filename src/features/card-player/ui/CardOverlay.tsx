import type * as React from "react";
import { useTranslation } from "react-i18next";
import { Description } from "@/shared/ui/content";
import { Overlay } from "@/shared/ui/feedback";

export interface CardOverlayProps {
  fsrs: { difficulty: number; lastReviewedAt: number } | null;
}

export const CardOverlay: React.FC<CardOverlayProps> = ({ fsrs }) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  return (
    <Overlay position="top">
      <div className="mx-auto flex max-w-content flex-row items-center gap-2 bg-surface-elevated py-2 pl-[calc(var(--spacing-study-inline)+env(safe-area-inset-left))] pr-[calc(var(--spacing-study-inline)+env(safe-area-inset-right))] text-ink">
        <Description>
          {fsrs === null
            ? t("cardList.card.notStudied")
            : t("studySession.cardDetails.fsrs", {
                difficulty: new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(fsrs.difficulty),
                date: new Intl.DateTimeFormat(locale).format(new Date(fsrs.lastReviewedAt)),
              })}
        </Description>
      </div>
    </Overlay>
  );
};
