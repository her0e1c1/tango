import type * as React from "react";
import { List } from "@/shared/components";
import { Layout } from "@/shared/components/layout/Layout";
import { DeckCard, type DeckCardActions, type StudyProgress } from "@/features/deck/components/DeckCard";

export interface ActiveStudyProgress extends StudyProgress {
  deckId: DeckId;
}

export interface DeckListTemplateProps {
  decks: Deck[];
  layout?: React.ComponentProps<typeof Layout>;
  deckCard?: DeckCardActions;
  studyProgress?: ActiveStudyProgress;
  feedbackSlot?: React.ReactNode;
}

export const DeckListTemplate: React.FC<DeckListTemplateProps> = (props) => {
  return (
    <Layout showHeader {...props.layout}>
      {props.feedbackSlot}
      <List>
        {props.decks?.map((deck) => {
          const studyProgress = props.studyProgress?.deckId === deck.id ? props.studyProgress : undefined;
          return (
            <DeckCard
              key={deck.id}
              deck={deck}
              {...(studyProgress !== undefined ? { studyProgress } : {})}
              {...props.deckCard}
            />
          );
        })}
      </List>
    </Layout>
  );
};
