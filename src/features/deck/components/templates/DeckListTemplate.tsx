import * as React from "react";
import { List } from "@src/shared/components";
import { Layout } from "@src/shared/components/layout/Layout";
import { DeckCard, type DeckCardActions, type StudyProgress } from "@src/features/deck/components/DeckCard";

export interface ActiveStudyProgress extends StudyProgress {
  deckId: DeckId;
}

export interface DeckListTemplateProps {
  decks: Deck[];
  layout?: React.ComponentProps<typeof Layout>;
  deckCard?: DeckCardActions;
  studyProgress?: ActiveStudyProgress;
}

export const DeckListTemplate: React.FC<DeckListTemplateProps> = (props) => {
  return (
    <Layout showHeader {...props.layout}>
      <List>
        {props.decks?.map((deck, i) => {
          const studyProgress = props.studyProgress?.deckId === deck.id ? props.studyProgress : undefined;
          return <DeckCard key={i} deck={deck} studyProgress={studyProgress} {...props.deckCard} />;
        })}
      </List>
    </Layout>
  );
};
