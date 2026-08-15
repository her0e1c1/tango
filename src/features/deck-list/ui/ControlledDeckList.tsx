import type { DeckId } from "@/entities/deck";
import type { DeckListSections } from "../model/buildDeckListSections";
import React from "react";
import { DeckListView } from "./DeckListView";

export const ControlledDeckList = ({ sections }: { sections: DeckListSections }) => {
  const [openMenuDeckId, setOpenMenuDeckId] = React.useState<DeckId>();
  return (
    <DeckListView
      sections={sections}
      deckCard={{
        openMenuDeckId,
        onToggleMenu: (id) => setOpenMenuDeckId((value) => (value === id ? undefined : id)),
        onCloseMenu: () => setOpenMenuDeckId(undefined),
      }}
    />
  );
};
