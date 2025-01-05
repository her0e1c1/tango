import * as React from "react";
import { Score, Description } from "../Atom";
import { Overlay } from "../Molecule";

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
