import type * as React from "react";
import { Description, Overlay, Score } from "@/shared/components";

export const CardOverlay: React.FC<{ card?: Card }> = (props) => {
  const card = props.card;
  return (
    <Overlay position="top">
      <div className="flex flex-row p-2">
        <Score score={card?.score ?? 0} />
        <Description className="ml-2">
          {card?.numberOfSeen != null && `${card.numberOfSeen} times`}
          {card?.lastSeenAt != null && ` since ${new Date(card.lastSeenAt)?.toLocaleDateString()}`}
        </Description>
      </div>
    </Overlay>
  );
};
