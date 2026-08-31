/**
 * @file Defines the Study Session Page's Card metadata overlay.
 * The component renders prepared values while state and workflow ownership remain in the Page.
 */

import type * as React from "react";
import { useTranslation } from "react-i18next";
import { Description, Score } from "@/shared/ui/content";
import { Overlay } from "@/shared/ui/feedback";

export interface CardOverlayProps {
  score?: number;
  numberOfSeen?: number;
  lastSeenAt?: number;
}

/** Shows the active Card's score and study metadata in a compact overlay. */
export const CardOverlay: React.FC<CardOverlayProps> = (props) => {
  const { t, i18n } = useTranslation();
  const formattedLastSeen =
    props.lastSeenAt == null
      ? undefined
      : new Intl.DateTimeFormat(i18n.resolvedLanguage ?? i18n.language).format(new Date(props.lastSeenAt));
  const metadata = (() => {
    if (props.numberOfSeen != null && formattedLastSeen !== undefined) {
      return t("studySession.cardDetails.seenSince", {
        count: props.numberOfSeen,
        date: formattedLastSeen,
      });
    }
    if (props.numberOfSeen != null) return t("studySession.cardDetails.seen", { count: props.numberOfSeen });
    if (formattedLastSeen !== undefined) return t("studySession.cardDetails.lastSeen", { date: formattedLastSeen });
    return null;
  })();

  return (
    <Overlay position="top">
      <div className="mx-auto flex max-w-content flex-row items-center gap-2 bg-surface-elevated py-2 pl-[calc(var(--spacing-study-inline)+env(safe-area-inset-left))] pr-[calc(var(--spacing-study-inline)+env(safe-area-inset-right))] text-ink">
        <Score score={props.score ?? 0} />
        <Description>{metadata}</Description>
      </div>
    </Overlay>
  );
};
