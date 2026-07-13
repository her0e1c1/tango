import * as React from "react";
import { List, Overlay } from "@src/shared/components";
import { Layout, type LayoutProps } from "@src/shared/components/layout/Layout";
import { BackText, type BackTextProps } from "@src/features/card/components/BackText";
import { Card, type CardProps } from "@src/features/card/components/Card";

export interface CardListOverlayProps {
  backText: BackTextProps;
  onClose?: () => void;
}

export interface CardListTemplateProps {
  cards: Card[];
  layout?: LayoutProps;
  filterSlot?: React.ReactNode;
  card?: CardProps;
  overlay?: CardListOverlayProps;
  onShowCard?: (card: Card) => void;
}

export const CardListTemplate: React.FC<CardListTemplateProps> = (props) => {
  return (
    <Layout showHeader {...props.layout}>
      {props.overlay != null && (
        <Overlay position="center" className="overflow-scroll bg-inherit" onClick={props.overlay.onClose}>
          <BackText {...props.overlay.backText} />
        </Overlay>
      )}
      <details className="sticky top-0 bg-inherit py-2 max-h-screen">
        <summary className="cursor-pointer border-b border-gray-300 dark:border-gray-600 pb-1 mb-1">filter</summary>
        {props.filterSlot}
      </details>
      <List col1>
        {props.cards?.map((c, i) => (
          <Card
            key={i}
            card={c}
            onSwipedLeft={props.card?.onSwipedLeft}
            onSwipedRight={props.card?.onSwipedRight}
            onDelete={props.card?.onDelete}
            goToEdit={props.card?.goToEdit}
            goToView={() => props.onShowCard?.(c)}
          />
        ))}
      </List>
    </Layout>
  );
};
