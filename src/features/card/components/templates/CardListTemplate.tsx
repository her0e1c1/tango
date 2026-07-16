import type * as React from "react";
import { List, Overlay } from "@/shared/components";
import { Layout, type LayoutProps } from "@/shared/components/layout/Layout";
import { BackText, type BackTextProps } from "@/features/card/components/BackText";
import { Card, type CardProps } from "@/features/card/components/Card";

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
  feedbackSlot?: React.ReactNode;
  isCardPending?: (id: CardId) => boolean;
}

export const CardListTemplate: React.FC<CardListTemplateProps> = (props) => {
  return (
    <Layout showHeader {...props.layout}>
      {props.feedbackSlot}
      {props.overlay != null && (
        <Overlay
          position="center"
          ariaLabel="Close card"
          className="overflow-y-auto bg-surface-elevated"
          {...(props.overlay.onClose !== undefined ? { onClick: props.overlay.onClose } : {})}
        >
          <BackText {...props.overlay.backText} />
        </Overlay>
      )}
      <details className="max-h-screen rounded-surface border border-border bg-surface-muted p-3">
        <summary className="mb-1 cursor-pointer border-b border-border pb-1 font-semibold text-ink">filter</summary>
        {props.filterSlot}
      </details>
      <List col1>
        {props.cards?.map((c) => (
          <Card
            key={c.id}
            card={c}
            disabled={props.isCardPending?.(c.id) ?? false}
            {...(props.card?.onSwipedLeft !== undefined ? { onSwipedLeft: props.card.onSwipedLeft } : {})}
            {...(props.card?.onSwipedRight !== undefined ? { onSwipedRight: props.card.onSwipedRight } : {})}
            {...(props.card?.onDelete !== undefined ? { onDelete: props.card.onDelete } : {})}
            {...(props.card?.goToEdit !== undefined ? { goToEdit: props.card.goToEdit } : {})}
            goToView={() => props.onShowCard?.(c)}
          />
        ))}
      </List>
    </Layout>
  );
};
