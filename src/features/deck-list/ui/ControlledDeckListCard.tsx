import type { DeckId } from "@/entities/deck";
import React from "react";
import { DeckListCard, type DeckListCardProps } from "./DeckListCard";

export const ControlledDeckListCard: React.FC<DeckListCardProps> = (props) => {
  const [openMenuDeckId, setOpenMenuDeckId] = React.useState<DeckId>();
  return (
    <DeckListCard
      {...props}
      openMenuDeckId={openMenuDeckId}
      onToggleMenu={(id) => setOpenMenuDeckId((value) => (value === id ? undefined : id))}
      onCloseMenu={() => setOpenMenuDeckId(undefined)}
    />
  );
};
