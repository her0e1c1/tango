/**
 * @file Defines the Study Session Page's Card metadata overlay.
 * The component renders prepared values while state and workflow ownership remain in the Page.
 */

import type * as React from "react";
import { Description } from "@/shared/ui/content";
import { Overlay } from "@/shared/ui/feedback";

export interface CardOverlayProps {
  difficultySlot?: React.ReactNode;
  numberOfSeen?: number;
  lastSeenAt?: number;
}

/** Shows the active Card's difficulty and study metadata in a compact overlay. */
export const CardOverlay: React.FC<CardOverlayProps> = (props) => (
  <Overlay position="top">
    <div className="mx-auto flex max-w-content flex-row items-center gap-2 bg-surface-elevated py-2 pl-[calc(var(--spacing-study-inline)+env(safe-area-inset-left))] pr-[calc(var(--spacing-study-inline)+env(safe-area-inset-right))] text-ink">
      {props.difficultySlot}
      <Description>
        {props.numberOfSeen != null && `${String(props.numberOfSeen)} times`}
        {props.lastSeenAt != null && ` since ${new Date(props.lastSeenAt).toLocaleDateString()}`}
      </Description>
    </div>
  </Overlay>
);
