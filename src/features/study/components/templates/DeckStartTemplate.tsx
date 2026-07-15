import type React from "react";
import { Button, Section } from "@/shared/components";
import { Layout, type LayoutProps } from "@/shared/components/layout/Layout";

export interface DeckStartTemplateProps {
  layout?: LayoutProps;
  config: ConfigState;
  cardsLength: number;
  filterSlot?: React.ReactNode;
  onClickStart?: () => void;
}

export const DeckStartTemplate: React.FC<DeckStartTemplateProps> = (props) => {
  return (
    <Layout showHeader {...props.layout}>
      <Section page title="Filter Cards" />
      <div className="flex justify-center">
        <Button
          primary
          disabled={props.cardsLength === 0}
          {...(props.onClickStart !== undefined ? { onClick: props.onClickStart } : {})}
          label={`Start to study ${Math.min(props.cardsLength, props.config.maxNumberOfCardsToLearn)} card(s) from ${
            props.cardsLength
          }`}
        />
      </div>
      {props.filterSlot}
    </Layout>
  );
};
