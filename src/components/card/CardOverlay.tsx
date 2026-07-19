import type * as React from "react";
import { Description, Overlay, Score } from "@/components";

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
