/**
 * @file Defines the card feature's Card Overlay presentation component.
 * The component renders props and reports user intent through callbacks while data access stays
 * outside the view.
 */

import type * as React from "react";
import { Description, Overlay, Score } from "@/components";

/**
 * Renders the Card Overlay user interface.
 * Shows the active card's score and tags in a compact overlay, falling back to neutral values
 * before a card is available.
 */
export const CardOverlay: React.FC<{ card?: Card }> = (props) => {
  const card = props.card;
  return (
    <Overlay position="top">
      <div className="mx-auto flex max-w-reading flex-row items-center gap-2 bg-surface-elevated p-2 text-ink">
        <Score score={card?.score ?? 0} />
        <Description>
          {card?.numberOfSeen != null && `${card.numberOfSeen} times`}
          {card?.lastSeenAt != null && ` since ${new Date(card.lastSeenAt).toLocaleDateString()}`}
        </Description>
      </div>
    </Overlay>
  );
};
