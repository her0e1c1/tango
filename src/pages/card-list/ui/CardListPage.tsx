import type * as React from "react";
import { useParams } from "react-router-dom";
import { useKey } from "react-use";

import { CardList, useCardListState } from "@/features/card-list";
import { BackText } from "@/features/card-view";
import { DeckFilterForm } from "@/features/deck-filter";
import { routes, useNavigation } from "@/features/navigate";
import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

const CardListContent = ({ deckId }: { deckId: string }) => {
  const navigation = useNavigation();
  const cardList = useCardListState(deckId);

  if (cardList == null) {
    return (
      <RouteNotFound title="Deck not found" description="The requested deck is unavailable or has been removed." />
    );
  }

  const deckFilter = cardList.filter;

  return (
    <AppLayout showHeader>
      <CardList
        state={cardList}
        filter={{
          scoreMax: deckFilter.scoreMax,
          scoreMin: deckFilter.scoreMin,
          selectedTags: deckFilter.selectedTags,
          controls: <DeckFilterForm {...deckFilter} tags={cardList.tags} />,
          onRemoveTag: (tag) => deckFilter.setSelectedTags(deckFilter.selectedTags.filter((value) => value !== tag)),
        }}
        {...(cardList.answer !== undefined ? { answerSlot: <BackText {...cardList.answer} /> } : {})}
        onEditCard={(id) => void navigation.to(routes.cardForm.to(id))}
      />
    </AppLayout>
  );
};

export const CardListPage: React.FC = () => {
  const params = useParams();
  const navigation = useNavigation();
  const deckId = params.id;
  if (deckId == null) throw new Error("invalid deck id");

  useKey("t", () => void navigation.to(routes.deckList.to()));
  useKey("s", () => void navigation.to(routes.settings.to()));

  // Route-scoped Feature state must not survive navigation to another Deck.
  return <CardListContent key={deckId} deckId={deckId} />;
};
