/**
 * @file Defines the card view feature's Card Overlay presentation component.
 * The component renders props and reports user intent through callbacks while data access stays
 * outside the view.
 */

import type { Card } from "@/entities/card";
import type { StudyProgress } from "@/entities/study-progress";

import type * as React from "react";
import { Description, Score } from "@/shared/ui/content";
import { Overlay } from "@/shared/ui/feedback";

/**
 * Renders the Card Overlay user interface.
 * Shows the active card's score and tags in a compact overlay, falling back to neutral values
 * before a card is available.
 */
export const CardOverlay: React.FC<{ card?: Card; progress?: StudyProgress }> = (props) => {
  const progress = props.progress;
  return (
    <Overlay position="top">
      <div className="mx-auto flex max-w-reading flex-row items-center gap-2 bg-surface-elevated p-2 text-ink">
        <Score score={progress?.score ?? 0} />
        <Description>
          {progress != null && `${progress.numberOfSeen} times`}
          {progress?.lastSeenAt != null && ` since ${new Date(progress.lastSeenAt).toLocaleDateString()}`}
        </Description>
      </div>
    </Overlay>
  );
};
