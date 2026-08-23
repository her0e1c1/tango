/**
 * @file Defines the card view feature's Card Overlay presentation component.
 * The component renders props and reports user intent through callbacks while data access stays
 * outside the view.
 */

import type * as React from "react";
import { Description, Score } from "@/shared/ui/content";
import { Overlay } from "@/shared/ui/feedback";

/**
 * Renders the Card Overlay user interface.
 * Shows the active card's score and tags in a compact overlay, falling back to neutral values
 * before a card is available.
 */
export interface CardOverlayProps {
  score?: number;
  numberOfSeen?: number;
  lastSeenAt?: number;
}

export const CardOverlay: React.FC<CardOverlayProps> = (props) => (
  <Overlay position="top">
    <div className="mx-auto flex max-w-content flex-row items-center gap-2 bg-surface-elevated py-2 pl-[calc(var(--spacing-study-inline)+env(safe-area-inset-left))] pr-[calc(var(--spacing-study-inline)+env(safe-area-inset-right))] text-ink">
      <Score score={props.score ?? 0} />
      <Description>
        {props.numberOfSeen != null && `${String(props.numberOfSeen)} times`}
        {props.lastSeenAt != null && ` since ${new Date(props.lastSeenAt).toLocaleDateString()}`}
      </Description>
    </div>
  </Overlay>
);
